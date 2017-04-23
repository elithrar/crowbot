import * as moment from "moment"
import { EventBot } from "./bot"
import *  as Discord from "discord.js"
import { ActionMap, Action } from "./bot"

// actions represent a chat command (e.g. !command), a description, and an
// Action. An Action is responsible for replying to the message (if
// applicable), handling errors and should not return anything.
export let actions: ActionMap = new Map<string, { "description": string, "action": Action }>()

actions.set(
  "playtests",
  {
    description: "Returns the current & upcoming Crowfall playtest schedule",
    action: listEvents
  }
)

actions.set(
  "help",
  {
    description: "Shows the help text",
    action: showHelpText,
  }
)

/**
 *  sendMessage sends the given text to the current channel.
 *
 * @param {Discord.Message} message
 * @param {string} payload
 */
function sendMessage(message: Discord.Message, text: string) {
  message.channel.sendMessage(text, { split: true })
    .catch((err) => {
      console.error(`error: failed to send message: ${err}`)
    })
}

/* Action functions */

/**
// listEvents lists any current or upcoming playtest events.
 * @param {Discord.Message} message
 * @param {string} command
 */
function listEvents(bot: EventBot, message: Discord.Message) {
  bot.getEvents(bot.getCalendarURL(), {})
    .then((events) => {
      let results = ["\n"]

      events.items.forEach((item) => {
        let now = Date.now()
        let created = message.createdAt
        let offset = -480

        if (now <= Date.parse(item.end.dateTime)) {
          let start = humanizeDate(item.start.dateTime, offset)
          let end = humanizeDate(item.end.dateTime, offset)

          if (now >= Date.parse(item.start.dateTime)) {
            // Highlight currently running events.
            results.push(`**Currently running**: ${start} until ${end} • ${item.summary}`)
          } else {
            results.push(`**Upcoming**: ${start} until ${end} • ${item.summary}`)
          }
        }
      })

      return results
    })
    .then((results) => {
      if (results.length < 1) {
        sendMessage(message, "🚫 no Crowfall playtests are currently running or scheduled.")
        return
      }

      sendMessage(message, `🗓️ Crowfall playtests: ${results.join("\n")}`)
    })
    .catch(err => {
      console.error(`error: failed to send message: ${err} (guild: ${message.guild.id})`)
    })
}

/**
 * showHelpText outputs the available actions and their associated description.
 *
 * @param {Discord.Message} message
 * @param {string} command
 */
function showHelpText(bot: EventBot, message: Discord.Message) {
  let cmds: string[] = []

  actions.forEach((value, key) => {
    cmds.push(`**${key}**: ${value.description}`)
  })

  let resp = `
Hi, I'm ${bot.botPrefix}.

Available commands:\n\n${cmds.join("\n")}

My source code lives here: \`https://github.com/elithrar/crowbot\` (ask there for help or feature requests)
`

  sendMessage(message, resp)
}

/**
 * humanizeDate pretty-prints a JavaScript date object.
 * @export
 * @param {string} date - the Date to be converted.
 * @param {offset} number - the offset (in minutes) from UTC to format as.
 * @returns {string} formatted - the formatted date.
 */
export function humanizeDate(date: Date, offset: number): string {
  if (!moment(date).isValid()) {
    throw new Error(`invalid date'${date}'`)
  }

  return moment(date).utcOffset(offset).format("ddd MMM Do, h:mmA (Z)")
}

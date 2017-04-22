import { Command, EventBot } from "./bot"
import * as Discord from "discord.js"
import * as moment from "moment"

export let commands: Command[] = [
  {
    name: "playtests",
    description: "Returns the current & upcoming Crowfall playtest schedule",
    aliases: ["pt"],
    action: listEvents
  },
  {
    name: "help",
    description: "Show the help text and all available commands.",
    aliases: ["?"],
    action: showHelpText
  },
]

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
        let created = message.createdAt.toString()

        if (now <= Date.parse(item.end.dateTime)) {
          let start = convertEventDate(item.start.dateTime, created)
          let end = convertEventDate(item.end.dateTime, created)

          if (now >= Date.parse(item.start.dateTime)) {
            // Highlight currently running events.
            results.push(`⚡️ ${start} until ${end} ‚Ä¢ ${item.summary}`)
          } else {
            results.push(`${start} until ${end} ‚Ä¢ ${item.summary}`)
          }
        }
      })

      return results
    })
    .then((results) => {
      if (results.length < 1) {
        sendMessage(message,  "🚫 no Crowfall playtests are currently running or scheduled.")
        return
      }

      sendMessage(message, `🗓 Crowfall playtests: ${results.join("\n")}`)
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

  commands.forEach((command) => {
    cmds.push(`**${command.name}**: (aka: ${command.aliases}) ${command.description}`)
  })

  let resp = `
Hi, I'm ${bot.botPrefix}.

Available commands:\n\n${cmds.join("\n")}

My source code lives here: \`https://github.com/elithrar/crowbot\` (ask there for help or feature requests)
`

  sendMessage(message, resp)
}

/**
 * convertEventDate pretty-prints a JavaScript date object, and converts it to the target date's timezone
 * @export
 * @param {string} date - the Date to be converted.
 * @param {string} target - the target date (to be used for its timezone)
 * @returns {string} formatted - the formatted date.
 */
export function convertEventDate(eventDate: string, target: string) {
  if (!moment(eventDate).isValid()) {
    throw new Error(`invalid event Date '${eventDate}'`)
  }

  if (!moment(target).isValid()) {
    throw new Error(`invalid user Date '${target}'`)
  }

  let offset = moment.parseZone(target).utcOffset()
  let local = moment(eventDate).utcOffset(offset).format("ddd MMM Do, h:mmA (Z)")

  return local
}

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
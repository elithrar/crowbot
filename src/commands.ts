import * as moment from "moment"
import getEvents from "./fetch"
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
    action: listUpcomingEvents
  }
)

actions.set(
  "playtests now",
  {
    description: "Is there a playtest running now?",
    action: listCurrentEvents
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
      console.error(`failed to send message: ${err}`)
    })
}

/* Action functions */

/**
// listUpcomingEvents lists any current or upcoming playtest events.
 *
 * @param {Discord.Message} message
 * @param {string} command
 */
function listUpcomingEvents(bot: EventBot, message: Discord.Message) {
  getEvents(bot.getCalendarURL(), {})
    .then((events) => {
      let results = ["\n"]

      events.items.forEach((item) => {
        let now = Date.now()

        if (now <= Date.parse(item.end.dateTime)) {
          // TODO(matt): re-use this for both listUpcomingEvents & listCurrentEvents.
          let start = convertEventDate(item.start.dateTime, message.createdAt)
          let end = convertEventDate(item.end.dateTime, message.createdAt)

          results.push(`${start} until ${end} • ${item.summary}`)
        }
      })

      return results
    })
    .then((results) => {
      if (results.length <= 1) {
        sendMessage(message, "🚫 - no Crowfall playtests are currently scheduled.")
        return
      }

      sendMessage(message, `🗓️ - Upcoming Crowfall playtests: ${results.join("\n")}`)
    })
}

/**
 * listCurrentEvents lists any currently running Crowfall playtests.
 *
 * @param {Discord.Message} message
 * @param {string} command
 */
function listCurrentEvents(bot: EventBot, message: Discord.Message) {
  getEvents(bot.getCalendarURL(), {})
    .then((events) => {
      let results = ["\n"]

      events.items.forEach((item) => {
        let now = Date.now()

        if (now >= Date.parse(item.start.dateTime) && now <= Date.parse(item.end.dateTime)) {
          // TODO(matt): re-use this for both listUpcomingEvents & listCurrentEvents.
          let start = convertEventDate(item.start.dateTime, message.createdAt)
          let end = convertEventDate(item.end.dateTime, message.createdAt)

          results.push(`${start} until ${end} • ${item.summary}`)
        }
      })

      return results
    })
    .then((results) => {
      if (results.length <= 1) {
        sendMessage(message, "🚫 - no Crowfall playtests are running right now.")
        return
      }

      sendMessage(message, `⚡️ - Currently running Crowfall playtests: ${results.join("\n")}`)
    })

}

/**
 * showHelpText outputs the available actions and their associated description.
 *
 * @param {Discord.Message} message
 * @param {string} command
 */
function showHelpText(bot: EventBot, message: Discord.Message) {
  let preface = `
Hi, I'm ${bot.botName}!

Available commands:
`

  let resp: string[] = [preface]

  actions.forEach((value, key) => {
    resp.push(`**${key}**: ${value.description}`)
  })

  resp.push(`
My source code lives at https://github.com/elithrar/crowbot (ask here for help or feature requests)
`)

  sendMessage(message, resp.join("\n"))
}

/**
 *  convertEventDate pretty-prints a JavaScript date object, and converts it to the target date's timezone
 *
 * @param {Date} date -the Date to be converted.
 * @param {Date} target - the target date (to be used for its timezone)
 * @returns {string} formatted - the formatted date.
 */
function convertEventDate(date: Date, target: Date) {
  if (!moment(date).isValid()) {
    throw new Error(`invalid event Date '${date}'`)
  }

  if (!moment(target).isValid()) {
    throw new Error(`invalid user Date '${target}'`)
  }

  let targetOffset = moment(target).utcOffset()
  let converted = moment(date).utcOffset(targetOffset).toString()

  return converted
}

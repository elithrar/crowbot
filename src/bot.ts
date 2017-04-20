import * as Discord from "discord.js"
import * as moment from "moment"
import * as rp from "request-promise"
import * as Bluebird from "bluebird"

global.Promise = Bluebird

/**
 *  EventBot provides a Google Calendar fetching Discord bot.
 */
export class EventBot {
  actions: ActionMap
  /**
   * botPrefix defines what command botPrefix will be used to call the bot (e.g. !botPrefix).
   * @type {string}
   * @memberOf EventBot
   */
  botPrefix: string
  protected client: Discord.Client // An instance of Discord.js's client.
  /**
   * config is an instance of BotConfig (configuration options for the bot).
   * @type {BotConfig}
   * @memberOf EventBot
   */
  config: BotConfig
  protected daysAhead: number // how far ahead (in days) to fetch events to
  protected permissions: Discord.PermissionResolvable[]
  protected cache: { "lastFetched": number, "events": any[] } = {
    lastFetched: 0,
    events: []
  }

  constructor(botPrefix: string, actions: ActionMap, config: BotConfig) {
    this.config = config

    if (this.config.token === "") {
      throw new Error("config.token must not be empty")
    }

    if (this.config.clientID === "") {
      throw new Error("config.clientID must not be empty")
    }

    if (this.config.googleAPIKey === "") {
      throw new Error("config.googleAPIKey must not be empty")
    }

    if (this.config.calendarID === "") {
      throw new Error("config.calendarID must not be empty")
    }

    this.botPrefix = `!${botPrefix}`

    this.client = new Discord.Client()
    if (this.config.clientOptions) {
      this.client.options = this.config.clientOptions
    }

    this.actions = actions

    // Defaults
    this.daysAhead = 30
    this.permissions = ["READ_MESSAGES", "SEND_MESSAGES", "EMBED_LINKS"]

    // TODO(matt): Kick-off calendar fetch to ensure permissions are correct & establish cache.
  }

  /**
   *  start the EventBot, logging it in and registering its event handlers.
   * @returns {void}
   * @memberOf EventBot
   */
  start(): Promise<string> {
    this.client.on("ready", () => {
      this.generateInvite()
        .then((link) => {
          console.log(`⚡️ add ${this.botPrefix} to your Discord server: ${link}`)
          console.log(`🤖 ${this.botPrefix} is ready for battle.`)
        }).catch((err) => {
          console.log(`${this.botPrefix} encounted an error when starting: ${err}`)
        })
    })
      .on("reconnecting", () => {
        console.log(`${this.botPrefix} is reconnecting...`)
      })
      .on("warning", (warning) => {
        console.warn(`warning: ${warning}`)
      })
      .on("error", (err) => {
        console.error(`error: ${err}`)
      })
      // Parse incoming messages for our command botPrefix and execute their actions.
      .on("message", message => {
        if (this.config.debug) {
          console.log(`debug: received message: ${message.content}`)
        }

        this.onMessage(message)
      })

    return this.client.login(this.config.token)
      .catch(err => {
        console.log("error: failed to log in")
        throw new Error(err)
      })
  }

  /**
   * destroy shuts down the bot.
   * @returns
   * @memberOf EventBot
   */
  async destroy() {
    return await this.client.destroy()
  }

  /**
   * hasBotPrefix returns true if the message has the bots' prefix.
   * @param {Discord.Message} message
   * @returns {boolean}
   * @memberOf EventBot
   */
  hasBotPrefix(message: Discord.Message): boolean {
    return message.content.startsWith(`${this.botPrefix}`)
  }

  /**
   * isBotMentioned returns true if the bot was mentioned. If multiple users
   * were mentioned, or @everyone was mentioned, this returns false.
   * @param {Discord.Message} message
   * @returns {boolean}
   * @memberOf EventBot
   */
  isBotMentioned(message: Discord.Message): boolean {
    return (message.isMentioned(this.client.user.id) && !message.mentions.everyone && message.mentions.users.size === 1)
  }

  /**
   * onMessage accepts Messages emitted by the Discord client and processes it.
   * @param {Discord.Message} message
   * @memberOf EventBot
   */
  onMessage(message: Discord.Message): void {
    if (this.isBotMentioned(message) || this.hasBotPrefix(message)) {
      let command = message.content.replace(`${this.botPrefix} `, "")
      command = command.replace(/^<@\d+> /, "")
      console.log(`received command: ${command} (guild: ${message.guild.id})`)

      // TODO(matt): Consider refactoring the Action interface used here; build
      // it from an object to support aliases.
      let action = this.actions.get(command)
      if (action) {
        action.action(this, message)
      }
    }
  }

  /**
   * generateInvite() returns the URL server owners can use to add this bot.
   * @returns {Promise<string>}
   * @memberOf EventBot
   */
  async generateInvite(): Promise<string> {
    return await this.client.generateInvite(this.permissions)
  }

  /**
   * getCalendarURL returns the Google Calendar API endpoint to fetch from.
   */
  getCalendarURL(): string {
    // TODO(matt): should we calculate this here, or abstract it? This is one
    // of the few pieces that ties EventBot to Google Calendar.
    let timeMin = encodeURIComponent(
      moment(Date.now()).subtract(1, "days").toJSON()
    )
    let timeMax = encodeURIComponent(
      moment(Date.now()).add(this.daysAhead, "days").toJSON()
    )

    let url = `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarID}@group.calendar.google.com/events?key=${this.config.googleAPIKey}&timeMin=${timeMin}&timeMax=${timeMax}&sanitizeHtml=true`

    return url
  }

  getEvents(url: string, options: any): Bluebird<any> {
    let maxAge = 600
    let now = Date.now()
    let cache = this.cache

    // Return events from the cache when possible.
    if (now - maxAge < cache.lastFetched || cache.events.length !== 0) {
      return new Bluebird((resolve) => {
        resolve(cache.events)
      })
    }

    return rp.get({
      uri: url,
      json: true
    })
      .then(body => {
        if (body.items === undefined) {
          throw new Error("event data not present in response")
        }

        cache.lastFetched = now
        cache.events = body

        return body
      })
      .catch((err) => {
        console.log(`error fetching events: ${err}`)
      })
  }
}

/**
 * BotConfig describes the required configuration for an EventBot.
 *
 * @interface BotConfig
 */
export interface BotConfig {
  /** The Discord bot (secret) token to authenticate as */
  token: string
  /** The Discord app (public) client ID for the 'add bot' URL */
  clientID: string
  /** The Google (secret) API key from console.developers.google.com */
  googleAPIKey: string
  /** The Google calendar ID to fetch */
  calendarID: string
  /** An instance of Discord.ClientOptions */
  clientOptions?: Discord.ClientOptions
  /** Debug mode (verbose logging of messages) */
  debug?: boolean
  /** Allow the bot to respond to direct mentions, without a botPrefix */
  allowMentions?: boolean
}

/**
 * ActionMap is a mapping of chat commands to their respective description and Action (callback).
 *
 * @export
 */
export type ActionMap = Map<string, { "description": string, "action": Action }>

/**
 * Action represents the callback ("action") tied to a chat command. It
 * accepts an instance of EventBot and a Discord.Message object.
 *
 * @export
 * @interface Action
 */
export interface Action {
  (bot: EventBot, message: Discord.Message): void
}

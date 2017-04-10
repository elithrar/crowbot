import * as Discord from "discord.js"
import * as moment from "moment"

/**
 *  EventBot provides a Google Calendar fetching Discord bot.
 */
export class EventBot {
  actions: ActionMap
  /**
   * botName defines how the bot will be
   * @type {string}
   * @memberOf EventBot
   */
  botName: string
  protected client: Discord.Client // An instance of Discord.js's client.
  config: BotConfig
  private daysAhead: number // how far ahead (in days) to fetch events to
  private permissions: Discord.PermissionResolvable[]
  private prefix: string

  constructor(botName: string, actions: ActionMap, config: BotConfig) {
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

    this.botName = botName
    this.prefix = `!${this.botName}`

    this.client = new Discord.Client()
    this.client.token = this.config.token
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
          console.log(`⚡️ add ${this.botName} to your Discord server: ${link}`)
          console.log(`🤖 ${this.botName} is ready for battle.`)
        }).catch((err) => {
          console.log(`${this.botName} encounted an error when starting: ${err}`)
        })
    })
    .on("reconnecting", () => {
      console.log(`${this.botName} is reconnecting...`)
    })
    .on("warning", (warning) => {
      console.warn(`warning: ${warning}`)
    })
    .on("error", (err) => {
      console.error(`error: ${err}`)
    })
    // Parse incoming messages for our command prefix and execute their actions.
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
   * onMessage accepts Messages emitted by the Discord client and processes it.
   * @param {Discord.Message} message
   * @memberOf EventBot
   */
  onMessage(message: Discord.Message): void {
    if (message.content.startsWith(`${this.prefix}`)) {
      let command = message.content.replace(`${this.prefix} `, "")
      console.log(`received command: ${command}`)

      // TODO(matt): this.botActions.actions.get("")
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
}

/**
 * BotConfig describes the required configuration for an EventBot.
 *
 * @interface BotConfig
 */
export interface BotConfig {
  // The Discord bot (secret) token to authenticate as
  token: string
  // The Discord app (public) client ID for the 'add bot' URL
  clientID: string
  // The Google (secret) API key from console.developers.google.com
  googleAPIKey: string
  // The Google calendar ID to fetch
  calendarID: string
  // An instance of Discord.ClientOptions
  clientOptions?: Discord.ClientOptions
  gitHubLink?: string
  debug?: boolean
  // TODO(matt): Allow a customizable readyMessage? addBotMessage?
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

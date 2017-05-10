import * as Discord from "discord.js"

export class Bot {
  bot: Discord.Client
  prefix: string
  commands: CommandMap
  config: BotConfig
  permissions: Discord.PermissionResolvable[]

  constructor(prefix: string, config: BotConfig, commands: Command[]) {
    this.config = config
    this.bot = new Discord.Client()
    this.commands = this.buildCommands(commands)

    this.prefix = prefix
  }

  buildCommands(commands: Command[]): CommandMap {
    let map = new Map<string, Command>()

    // Build a Map of all commands and their aliases (if any).
    commands.forEach((command) => {
      map.set(command.name, command)

      if (command.aliases) {
        command.aliases.forEach((alias) => {
          map.set(alias, command)
        })
      }
    })

    return map
  }

  start(): Promise<string> {
    this.bot.on("ready", () => {
      this.generateInvite()
        .then((link) => {
          console.log(`🔗 add ${this.prefix} to your Discord server: ${link}`)
          console.log(`🤖 ${this.prefix} is ready for battle.`)
        }).catch((err) => {
          console.log(`${this.prefix} encounted an error when starting: ${err}`)
        })
    })
      .on("reconnecting", () => {
        console.log(`${this.prefix} is reconnecting...`)
      })
      .on("warning", (warning: string) => {
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

    return this.bot.login(this.config.token)
      .catch(err => {
        throw new Error(`failed to log in: ${err}`)
      })
  }

  stop(): Promise<void> {
    return this.bot.destroy()
  }

  /**
   * isBotCommand returns true if the message contains the bot's prefix with
   * at least one argument, or if the bot is directly at-mentioned.
   * @param {Discord.Message} message
   * @returns {boolean}
   *
   * @memberof Bot
   */
  isBotCommand(message: Discord.Message): boolean {
    let args = message.content.split(" ")
    // Respond if the bot prefix is used with at least one command OR if the
    // bot is directly mentioned.
    if (args.length >= 2 && args[0] === this.prefix) {
      return true
    } else if (message.mentions.users.size === 1 &&
      message.mentions.users.has(this.bot.user.id) &&
      !message.mentions.everyone) {
      return true
    }

    return false
  }

  onMessage(message: Discord.Message): void {
    if (this.isBotCommand(message)) {
      let command = message.content.split(" ").slice(1, 3)[0]
      // let command = message.content.replace(`${this.prefix}`, "").trim()
      // command = command.replace(/^<@\d+> /, "")
      console.log(`received command: ${command} (channel: ${message.channel.id})`)

      // TODO(matt): Consider refactoring the Action interface used here; build
      // it from an object to support aliases.
      let action = this.commands.get(command)
      if (action) {
        action.action(this, message)
      }
    }
  }

  generateInvite(): Promise<string> {
    return this.bot.generateInvite(this.permissions)
  }
}
/**
 * BotConfig contains the configuration a Bot.
 * @interface BotConfig
 */
export interface BotConfig {
  /** The Discord bot (secret) token to authenticate as */
  token: string
  /** An instance of Discord.ClientOptions */
  clientOptions?: Discord.ClientOptions
  /** Permissions the bot needs. */
  permissions?: Discord.PermissionResolvable[]
  /** Debug mode (verbose logging of messages) */
  debug?: boolean
}

/**
 * Command represents a chat command with its associated aliases, description and action (callback).
 * @export
 * @interface Command
 */
export interface Command {
  /**
   * action is the function to execute for that command.
   * @type {Action}
   * @memberOf Command
   */
  action: Action // should be (EventBot, Discord.Message): string - ?
  /**
   * aliases for the command.
   * @type {string[]}
   * @memberOf Command
   */
  aliases?: string[]
  /**
   * optional arguments for the command - e.g !prefix <command> <args>
   * @type {string[]}
   * @memberOf Command
   */
  args?: string[]
  /**
   * The human-readable description of the command.
   * @type {string}
   * @memberOf Command
   */
  description: string
  /**
   * The name of the command (what it will be executed by).
   * @type {string}
   * @memberOf Command
   */
  name: string
}

export type CommandMap = Map<string, Command>

/**
 * Action represents the callback ("action") tied to a chat command. It
 * accepts an instance of EventBot and a Discord.Message object.
 * @export
 * @interface Action
 */
export interface Action {
  (bot: Bot, message: Discord.Message): void
}

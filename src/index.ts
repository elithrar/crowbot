import * as Discord from "discord.js"
import * as program from "commander"
import * as commands from "./commands"
import { EventBot } from "./bot"

function main() {
  program
    .version("0.0.1")
    .description("crowbot: a Discord bot for Crowfall playtest dates (+ more)")
    .option("--bot-token <bot-token>", "The Discord bot (secret) token to authenticate as", process.env.DISCORD_BOT_TOKEN)
    .option("--client-id <client_id>", "The Discord app (public) client ID for the 'add bot' URL", process.env.DISCORD_CLIENT_ID)
    .option("--google-api-key <API key>", "Your Google (secret) API key from console.developers.google.com", process.env.GOOGLE_API_KEY)
    .option("--debug", "Enable debug output")
    .parse(process.argv)

  let eventBot = new EventBot(
    "crowbot",
    commands.actions,
    {
      token: program.botToken,
      clientID: program.clientId,
      googleAPIKey: program.googleApiKey,
      // The Crowfall playtest calendar ID.
      calendarID: "l3rc1f28d4ohrl6otdl6dcs1vo",
      debug: program.debug,
      allowMentions: true
    }
  )

  eventBot.start()
    .catch(err => {
      console.log(err)
      process.exit(1)
    })

  process.once("SIGINT", async () => {
    await eventBot.destroy()
  })
}

if (require.main === module) {
  main()
} else {
  console.error("use yarn start || npm start - don't import this bot directly")
}

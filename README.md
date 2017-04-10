# crowbot 🐦🤖

`crowbot` is a useful Discord bot that lets you know whether there's a [Crowfall](https://www.crowfall.com/) (an upcoming fantasy MMORPG) playtest currently running, and what future playtests are [scheduled](https://www.crowfall.com/en/playtest-schedule/).

Example commands:

* `!crowfall playtests` - Returns the current & upcoming Crowfall playtest schedule.
* `!crowfall playtest now` - is there a playtest running now?
* `!crowfall help` - Shows the help text.

Feature additions and/or suggestions are welcome. If ArtCraft offer an API for account and/or game data, crowbot will be extended to hook into these.

## Use on your Discord channel

*Note*: This bot, like many others, works by reading message events from your preferred channel(s) by subscribing to an event stream from Discord. This *does* mean that the bot can read all messages in the channels it has been enabled for. Although communication is *only* over HTTPS (TLS) and the bot does not log messages, there is always an element of trust (as with any bot!). If you don't trust this bot, you are welcome to deploy your own version of it or modify the source (noting the associated LICENSE file).

## Deploy to Heroku or Zeit Now

You can run this yourself by deploying to [Heroku](https://www.heroku.com/), [Now](https://zeit.co/now) or your own server.

## License

3-Clause-BSD licensed. See the LICENSE file for further details.

import "mocha"
import * as assert from "assert"
import * as Discord from "discord.js"
import * as moment from "moment"
import { EventBot, BotConfig, ActionMap } from "../EventBot"
import { actions, humanizeDate } from "../commands"

describe("sanity check", () => {
  it("should pass", () => {
    assert.equal("sanity", "sanity")
  })
})

describe("create a new BotConfig", () => {
  it("should instantiate a BotConfig with the correct properties", () => {
    assert.ok(true)
  })
})

describe("create a new EventBot", () => {
  it("should instantiate an EventBot with the correct properties", () => {
    let config: BotConfig = { token: "a", googleAPIKey: "b", clientID: "c", calendarID: "d" }
    let eb = new EventBot("testBot", actions, config)

    assert.equal(eb.botPrefix, "!testBot")
    assert.equal(eb.actions, actions)
    assert.equal(eb.config, config)
  })
})

describe("humanize event dates", () => {
  it("should humanize event dates and set the UTC offset", () => {
    let tests: { from: Date, offset: number, expects: string }[] = [
      { from: new Date("2017-04-03T22:30:00-07:00"), offset: -300, expects: "Tue Apr 4th, 12:30AM (-05:00)" },
      { from: new Date("2017-04-20T12:00:00-00:00"), offset: 480, expects: "Thu Apr 20th, 8:00PM (+08:00)" },
      { from: new Date("2017-04-20T12:00:00-05:00"), offset: 0, expects: "Thu Apr 20th, 5:00PM (+00:00)" },
    ]

    tests.forEach((test) => {
      assert.equal(humanizeDate(test.from, test.offset), test.expects, "invalid date")
    })
  })
})

/*
 * Add tests for:
 * - onMessage (mock a Discord.Message, check that we get a response)
 * - getEvents (break out into useCache(lastFetched, maxAge): boolean function, unit test it)
 * - getEvents (integration test - spin up test server, hit it, return mocked results)
*/

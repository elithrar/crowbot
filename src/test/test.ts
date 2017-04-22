import "mocha"
import * as assert from "assert"
import * as Discord from "discord.js"
import * as moment from "moment"
import { EventBot, BotConfig, CommandMap } from "../bot"
import { commands, convertEventDate } from "../commands"

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
    let config: BotConfig = {token: "a", googleAPIKey: "b", clientID: "c", calendarID: "d"}
    let eb = new EventBot("testBot", commands, config)

    assert.equal(eb.botPrefix, "!testBot")
    assert.equal(eb.commands, commands)
    assert.equal(eb.config, config)
  })
})

describe("convert timestamps to the user's timezone", () => {
  it("should convert timezones to the correct UTC offset", () => {
    let from = "2017-04-03T22:30:00-05:00"
    let target = "2017-04-20T12:21:00+01:00"

    let local = convertEventDate(from, target)

    assert.equal(local, "Tue Apr 4th, 4:30AM (+01:00)", "timestamps do not match")
  })
})

/*
 * Add tests for:
 * - onMessage (mock a Discord.Message, check that we get a response)
 * - getEvents (break out into useCache(lastFetched, maxAge): boolean function, unit test it)
 * - getEvents (integration test - spin up test server, hit it, return mocked results)
*/

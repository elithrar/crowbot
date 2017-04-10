import "mocha"
import * as assert from "assert"
import * as Discord from "discord.js"
import { EventBot, BotConfig, ActionMap } from "../bot"
import { actions } from "../commands"

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
    let eb = new EventBot("testBot", actions, config)

    assert.equal(eb.botName, "testBot")
    assert.equal(eb.actions, actions)
    assert.equal(eb.config, config)
  })
})

/*
 * Add tests for:
 * - onMessage (mock a Discord.Message, check that we get a response)
 * - getEvents (break out into useCache(lastFetched, maxAge): boolean function, unit test it)
 * - getEvents (integration test - spin up test server, hit it, return mocked results)
*/

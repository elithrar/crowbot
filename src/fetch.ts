import * as Promise from "bluebird"
import * as rp from "request-promise"

// TODO(matt): Move this into the EventBot instance.
let cache: { "lastFetched": number, "events": any[] } = {
  lastFetched: 0,
  events: []
}

// TODO(matt): Move this into the EventBot instance.
export default function getEvents(url: string, options: any): Promise<any> {
  let maxAge = 600
  let now = Date.now()

  // Return events from the cache when possible.
  if (now - maxAge < cache.lastFetched || cache.events.length !== 0) {
    return new Promise((resolve) => {
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

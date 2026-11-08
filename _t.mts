const realFetch = globalThis.fetch
globalThis.fetch = (async (url: any, init: any) => {
  if (String(url).includes('anthropic.com')) {
    const body = JSON.parse(init.body); console.log('PROMPT>>', body.messages[0].content.slice(0, 1500))
    return new Response(JSON.stringify({ id:'m',type:'message',role:'assistant',model:'x',content:[{type:'text',text:'{"instagram":null,"facebook":null,"why":"mock"}'}],stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}}),{headers:{'content-type':'application/json'}})
  }
  return realFetch(url, init)
}) as any
const { findSocial } = await import('./lib/restaurant-build/find-social.ts')
const t = Date.now()
await findSocial({ placeId: process.argv[2], name: process.argv[3], city: process.argv[4], area: process.argv[5] })
console.log('secs', (Date.now()-t)/1000)

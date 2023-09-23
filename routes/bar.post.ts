export default defineEventHandler(async event => {
  const data = await $fetch('/foo')
  setHeader(event, 'x-labin', 'digital all the way')
  return {
    bar: 'post',
    data
  }
})

import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'

const INSTRUCTIONS = 'You are a helpful AI assistant. Answer in the same language as the user.'

export const agents = {
  'gpt-5-nano': new Agent({ id: 'gpt-5-nano-agent', name: 'gpt-5-nano-agent', instructions: INSTRUCTIONS, model: openai('gpt-5-nano') }),
} as const

export const mastra = new Mastra({ agents })

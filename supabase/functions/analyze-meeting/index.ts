import Anthropic from 'npm:@anthropic-ai/sdk@0.53.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          context: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'context', 'tags'],
        additionalProperties: false,
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['title', 'description'],
        additionalProperties: false,
      },
    },
  },
  required: ['decisions', 'tasks'],
  additionalProperties: false,
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify authenticated user
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { summary, title, workingGroup } = await req.json()

  if (!summary?.trim()) {
    return new Response(JSON.stringify({ error: 'Conteúdo da ata não informado' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `Você é um especialista em análise de atas de reunião corporativas do setor financeiro/bancário.

Sua função é identificar com precisão:

DECISÕES: Escolhas definitivas tomadas pelo grupo, aprovações formais, definições de padrões ou protocolos, posicionamentos institucionais. São afirmações no passado ou presente que indicam que algo FOI decidido.

PLANOS DE AÇÃO: Tarefas e ações a executar futuramente, itens de follow-up, responsabilidades atribuídas, compromissos assumidos. São coisas que PRECISAM ser feitas.

Regras importantes:
- Extraia apenas itens explicitamente presentes na ata, não infira ou invente
- Títulos devem ser concisos e objetivos (máx. 100 caracteres)
- Contexto das decisões deve capturar o racional ou impacto mencionado
- Tags devem ser palavras-chave relevantes (tecnologias, áreas, siglas do setor)
- Se não houver decisões ou tarefas claras, retorne arrays vazios`,
    messages: [
      {
        role: 'user',
        content: `Analise a ata abaixo e extraia as decisões e planos de ação:

Título da reunião: ${title}
Grupo de Trabalho: ${workingGroup || 'Não informado'}

Conteúdo da ata:
${summary}`,
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        name: 'meeting_analysis',
        schema: ANALYSIS_SCHEMA,
      },
    },
  })

  const textBlock = response.content.find((b: { type: string }) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return new Response(JSON.stringify({ error: 'Resposta inesperada do modelo' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const result = JSON.parse(textBlock.text)

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

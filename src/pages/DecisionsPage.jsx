import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Tag, Calendar, FileText, Search, ArrowRight } from 'lucide-react'

function formatDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('decisions')
      .select('*, meetings(title, date, working_group_id, working_groups(name))')
      .order('created_at', { ascending: false })
    setDecisions(data || [])
    setLoading(false)
  }

  const filtered = decisions.filter((d) => {
    const q = search.toLowerCase()
    return (
      d.title.toLowerCase().includes(q) ||
      (d.context || '').toLowerCase().includes(q) ||
      (d.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (d.meetings?.title || '').toLowerCase().includes(q) ||
      (d.meetings?.working_groups?.name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          Base de Conhecimento — Decisões
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pesquise decisões por palavras-chave, tags (ex: "CIBA", "ITP", "Pix") ou reunião
        </p>
      </div>

      {/* Barra de busca global */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder='Pesquisar por título, contexto, tag, grupo de trabalho...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {search && (
        <p className="text-sm text-gray-500">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''} para <strong>"{search}"</strong>
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? 'Nenhuma decisão encontrada para esta busca' : 'Nenhuma decisão registrada ainda'}
          </p>
          <p className="text-sm mt-1">
            {search ? 'Tente termos diferentes.' : 'Registre decisões dentro de uma ata de reunião.'}
          </p>
          {!search && (
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link to="/reunioes">Ir para Atas de Reunião</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{d.title}</h3>

                {d.context && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{d.context}</p>
                )}

                {d.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {d.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearch(tag)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Tag className="w-3 h-3" /> {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3 mt-1">
                  <div className="flex flex-wrap gap-3">
                    {d.meetings && (
                      <>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {d.meetings.title}
                        </span>
                        {d.meetings.working_groups?.name && (
                          <span className="text-blue-500">{d.meetings.working_groups.name}</span>
                        )}
                        {d.meetings.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(d.meetings.date)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {d.meetings && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                      <Link to={`/reunioes/${d.meetings.id}`}>
                        Ver ata <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

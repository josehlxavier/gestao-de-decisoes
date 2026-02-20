import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  FileText,
  Users,
  BookOpen,
  ArrowRight,
  Flame,
} from 'lucide-react'

function getScoreColor(score) {
  if (score >= 75) return 'bg-red-100 text-red-800 border-red-200'
  if (score >= 27) return 'bg-orange-100 text-orange-800 border-orange-200'
  if (score >= 8) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-green-100 text-green-800 border-green-200'
}

function getScoreLabel(score) {
  if (score >= 75) return 'Crítico'
  if (score >= 27) return 'Alto'
  if (score >= 8) return 'Médio'
  return 'Baixo'
}

function ScoreBar({ score, max = 125 }) {
  const pct = Math.round((score / max) * 100)
  const color = score >= 75 ? 'bg-red-500' : score >= 27 ? 'bg-orange-400' : score >= 8 ? 'bg-yellow-400' : 'bg-green-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState({ groups: 0, meetings: 0, decisions: 0, tasks: 0, pendingTasks: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [issuesRes, groupsRes, meetingsRes, decisionsRes, tasksRes] = await Promise.all([
        supabase
          .from('issues')
          .select('*, working_groups(name)')
          .eq('status', 'Aberto')
          .order('score', { ascending: false })
          .limit(10),
        supabase.from('working_groups').select('id', { count: 'exact', head: true }),
        supabase.from('meetings').select('id', { count: 'exact', head: true }),
        supabase.from('decisions').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id, status', { count: 'exact' }),
      ])

      setIssues(issuesRes.data || [])
      const taskData = tasksRes.data || []
      setStats({
        groups: groupsRes.count || 0,
        meetings: meetingsRes.count || 0,
        decisions: decisionsRes.count || 0,
        tasks: taskData.length,
        pendingTasks: taskData.filter((t) => t.status !== 'Concluído').length,
      })
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Grupos de Trabalho', value: stats.groups, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', to: '/grupos' },
    { label: 'Atas de Reunião', value: stats.meetings, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', to: '/reunioes' },
    { label: 'Decisões Registradas', value: stats.decisions, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50', to: '/decisoes' },
    { label: 'Tarefas em Aberto', value: stats.pendingTasks, icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50', to: '/tarefas' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Visão geral do sistema e prioridades da Matriz GUT</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{c.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
                    <c.icon className={`w-6 h-6 ${c.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Matriz GUT */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Matriz GUT — Problemas por Prioridade
            </CardTitle>
            <CardDescription className="mt-1">
              Ordenado por Score (G × U × T) decrescente · Apenas issues em aberto
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/issues">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum problema em aberto</p>
              <p className="text-sm mt-1">Cadastre problemas na Matriz GUT para priorizá-los aqui.</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/issues">Ir para Matriz GUT</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Legenda */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  Crítico (≥ 75)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                  Alto (≥ 27)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                  Médio (≥ 8)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                  Baixo (&lt; 8)
                </span>
              </div>

              {issues.map((issue, idx) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {/* Ranking */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {idx + 1}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{issue.title}</p>
                        {issue.working_groups?.name && (
                          <p className="text-xs text-gray-400 mt-0.5">{issue.working_groups.name}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(issue.score)}`}>
                          {issue.score}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{getScoreLabel(issue.score)}</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <ScoreBar score={issue.score} />
                    </div>

                    {/* G U T detalhes */}
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span title="Gravidade">G: <strong className="text-gray-700">{issue.gravity}</strong></span>
                      <span title="Urgência">U: <strong className="text-gray-700">{issue.urgency}</strong></span>
                      <span title="Tendência">T: <strong className="text-gray-700">{issue.tendency}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

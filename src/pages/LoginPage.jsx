import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let result
    if (mode === 'login') {
      result = await signIn(form.email, form.password)
    } else {
      if (!form.name.trim()) {
        setError('Nome é obrigatório.')
        setLoading(false)
        return
      }
      result = await signUp(form.email, form.password, form.name)
      if (!result.error) {
        setError('')
        setMode('login')
        setForm({ name: '', email: form.email, password: '' })
        setLoading(false)
        return
      }
    }

    if (result.error) {
      const msg = result.error.message
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.')
      } else if (msg.includes('User already registered')) {
        setError('Este email já está cadastrado.')
      } else if (msg.includes('Password should be at least')) {
        setError('A senha deve ter no mínimo 6 caracteres.')
      } else {
        setError(msg)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Decisões</h1>
          <p className="text-gray-500 text-sm mt-1">Knowledge Base & Planos de Ação</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Acesse o sistema com seu email e senha.'
                : 'Preencha os dados para criar sua conta.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {mode === 'login' ? 'Entrando...' : 'Cadastrando...'}
                  </span>
                ) : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-gray-500">
                  Não tem conta?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError('') }}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Criar conta
                  </button>
                </p>
              ) : (
                <p className="text-gray-500">
                  Já tem conta?{' '}
                  <button
                    onClick={() => { setMode('login'); setError('') }}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistema interno de gestão do conhecimento · Open Finance
        </p>
      </div>
    </div>
  )
}

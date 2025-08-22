import { http, HttpResponse } from 'msw'
import { mockMembers, mockTrainers, mockSessions, mockSubscriptions, mockSubscriptionPlans } from './data'

export const handlers = [
  // Members API
  http.get('/api/members', () => {
    return HttpResponse.json({
      data: mockMembers,
      count: mockMembers.length,
    })
  }),

  http.post('/api/members', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    const newMember = {
      id: `member-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: newMember })
  }),

  http.get('/api/members/:id', ({ params }) => {
    const member = mockMembers.find(m => m.id === params.id)
    if (!member) {
      return HttpResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: member })
  }),

  http.put('/api/members/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, any>
    const memberIndex = mockMembers.findIndex(m => m.id === params.id)
    if (memberIndex === -1) {
      return HttpResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    const updatedMember = {
      ...mockMembers[memberIndex],
      ...body,
    }
    return HttpResponse.json({ data: updatedMember })
  }),

  http.delete('/api/members/:id', ({ params }) => {
    const memberIndex = mockMembers.findIndex(m => m.id === params.id)
    if (memberIndex === -1) {
      return HttpResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ success: true })
  }),

  // Members Stats API
  http.get('/api/members/stats', () => {
    return HttpResponse.json({
      data: {
        total: mockMembers.length,
        active: mockMembers.filter(m => m.membershipStatus === 'active').length,
        inactive: mockMembers.filter(m => m.membershipStatus === 'inactive').length,
        frozen: mockMembers.filter(m => m.membershipStatus === 'frozen').length,
        cancelled: mockMembers.filter(m => m.membershipStatus === 'cancelled').length,
        newThisMonth: mockMembers.filter(m => {
          const joinDate = new Date(m.joinDate)
          const now = new Date()
          return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
        }).length,
      },
    })
  }),

  // Training Sessions API
  http.get('/api/sessions', () => {
    return HttpResponse.json({
      data: mockSessions,
      count: mockSessions.length,
    })
  }),

  http.post('/api/sessions', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    const newSession = {
      id: `session-${Date.now()}`,
      ...body,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json({ data: newSession })
  }),

  // Trainers API
  http.get('/api/trainers', () => {
    return HttpResponse.json({
      data: mockTrainers,
      count: mockTrainers.length,
    })
  }),

  // Subscriptions API
  http.get('/api/subscriptions', () => {
    return HttpResponse.json({
      data: mockSubscriptions,
      count: mockSubscriptions.length,
    })
  }),

  // Subscription Plans API
  http.get('/api/subscription-plans', () => {
    return HttpResponse.json({
      data: mockSubscriptionPlans,
      count: mockSubscriptionPlans.length,
    })
  }),

  // Auth API
  http.post('/auth/v1/token', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    if (body?.email === 'admin@fitness.com' && body?.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        user: {
          id: 'admin-user-id',
          email: 'admin@fitness.com',
          role: 'admin',
        },
      })
    }
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  // Generic error handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`)
    return HttpResponse.json(
      { error: 'Not implemented in mock' },
      { status: 501 }
    )
  }),
]
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserCredits {
  monthly_generations_used: number
  monthly_generations_limit: number
  comic_panels_used: number
  comic_panels_limit: number
  reset_date: string
}

export function useUserCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  const fetchCredits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_quotas')
        .select('monthly_generations_used, monthly_generations_limit, comic_panels_used, comic_panels_limit, reset_date')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If user quotas don't exist, create them with default values
        if (error.code === 'PGRST116') {
          const resetDate = new Date()
          resetDate.setMonth(resetDate.getMonth() + 1)

          const { data: newQuotas, error: insertError } = await supabase
            .from('user_quotas')
            .insert({
              user_id: userId,
              monthly_generations_used: 0,
              monthly_generations_limit: 5,
              comic_panels_used: 0,
              comic_panels_limit: 10,
              reset_date: resetDate.toISOString()
            })
            .select('monthly_generations_used, monthly_generations_limit, comic_panels_used, comic_panels_limit, reset_date')
            .single()

          if (insertError) {
            console.error('Error creating user quotas:', insertError)
            return
          }

          setCredits(newQuotas)
        } else {
          console.error('Error fetching user quotas:', error)
        }
      } else {
        setCredits(data)
      }
    } catch (err) {
      console.error('Unexpected error fetching credits:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchCredits(user.id)
      } else {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)

        if (newUser) {
          await fetchCredits(newUser.id)
        } else {
          setCredits(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchCredits])

  const refreshCredits = async () => {
    if (user) {
      setLoading(true)
      await fetchCredits(user.id)
    }
  }

  return {
    credits,
    loading,
    user,
    refreshCredits
  }
}

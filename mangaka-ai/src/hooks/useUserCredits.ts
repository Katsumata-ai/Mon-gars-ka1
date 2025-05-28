'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserCredits {
  credits_remaining: number
  credits_total: number
  subscription_tier: 'free' | 'pro'
}

export function useUserCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  const fetchCredits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining, credits_total, subscription_tier')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If user credits don't exist, create them with default values
        if (error.code === 'PGRST116') {
          const { data: newCredits, error: insertError } = await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              credits_remaining: 5,
              credits_total: 5,
              subscription_tier: 'free'
            })
            .select('credits_remaining, credits_total, subscription_tier')
            .single()

          if (insertError) {
            console.error('Error creating user credits:', insertError)
            return
          }

          setCredits(newCredits)
        } else {
          console.error('Error fetching user credits:', error)
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

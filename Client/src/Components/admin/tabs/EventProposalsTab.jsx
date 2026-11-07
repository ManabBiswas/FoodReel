import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { showSuccess, showError, showWarning } from '../../../utils/toast'
import { formatDate } from '../../../utils/foodfest'
import { API_ENDPOINTS } from '../../../config/Api'

const EventProposalsTab = ({ setError }) => {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProposals = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.foodfest.adminProposals, {
        withCredentials: true
      })
      if (res.data.success) {
        setProposals(res.data.proposals)
      } else {
        setError('Failed to load proposals')
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err)
      showError('Failed to load proposals')
      setError('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }, [setError])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleApprove = async (proposalId) => {
    if (!window.confirm('Approve this proposal? This creates a draft event and grants the user organizer access.')) return

    try {
      const res = await axios.patch(
        API_ENDPOINTS.foodfest.adminApproveProposal(proposalId),
        {},
        { withCredentials: true }
      )
      if (res.data.success) {
        showSuccess(res.data.message)
        fetchProposals()
      } else {
        showError(res.data.message || 'Failed to approve')
        setError(res.data.message || 'Failed to approve')
      }
    } catch (err) {
      console.error('Approve error:', err)
      showError(err?.response?.data?.message || 'Failed to approve proposal')
      setError('Failed to approve proposal')
    }
  }

  const handleReject = async (proposalId) => {
    if (!window.confirm('Reject this proposal?')) return

    try {
      const res = await axios.patch(
        API_ENDPOINTS.foodfest.adminRejectProposal(proposalId),
        {},
        { withCredentials: true }
      )
      if (res.data.success) {
        showWarning('Proposal rejected')
        fetchProposals()
      } else {
        showError('Failed to reject')
        setError('Failed to reject')
      }
    } catch (err) {
      console.error('Reject error:', err)
      showError(err?.response?.data?.message || 'Failed to reject proposal')
      setError('Failed to reject proposal')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 animate-pulse sm:grid-cols-2">
          <div className="h-32 rounded-2xl bg-gray-100 p-4" />
          <div className="h-24 rounded-2xl bg-gray-100 p-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {proposals.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No proposals yet</p>
          <p className="mt-2 text-sm text-gray-400">
            Users can submit event proposals for your review
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal._id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="p-5">
                <h3 className="mb-1 font-serif text-lg font-bold text-gray-900">
                  {proposal.name}
                </h3>
                <p className="mb-3 line-clamp-3 text-sm text-gray-500">
                  {proposal.description}
                </p>

                <div className="mb-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-gray-400">Venue: </span>
                    <span className="text-gray-700">
                      {proposal.venue?.address}, {proposal.venue?.city}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400">Submitted: </span>
                    <span className="text-gray-700">
                      {formatDate(proposal.createdAt)}
                    </span>
                  </div>
                  {proposal.venue?.gpsLoc && (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-400">GPS: </span>
                      <span className="break-all text-gray-700">{proposal.venue.gpsLoc}</span>
                    </div>
                  )}
                  {proposal.otherInfo && (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-400">Notes: </span>
                      <span className="text-gray-700">{proposal.otherInfo}</span>
                    </div>
                  )}
                </div>

                <p className="mb-3 text-xs text-gray-400">
                  Submitted by {proposal.user?.firstName || 'Unknown user'}
                  {proposal.user?.lastName ? ` ${proposal.user.lastName}` : ''}
                  {proposal.user?.email ? ` · ${proposal.user.email}` : ''}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(proposal._id)}
                    className="flex-1 rounded bg-green-100 px-2 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(proposal._id)}
                    className="flex-1 rounded bg-red-100 px-2 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventProposalsTab
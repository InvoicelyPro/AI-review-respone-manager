import ReviewInbox from '@/components/reviews/review-inbox'

export default function InboxPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Review Inbox</h1>
        <p className="text-slate-400 mt-1">
          Manage and respond to your Google reviews
        </p>
      </div>
      <ReviewInbox />
    </div>
  )
}

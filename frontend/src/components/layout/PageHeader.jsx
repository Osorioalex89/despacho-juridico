export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4
                    flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-medium text-gray-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
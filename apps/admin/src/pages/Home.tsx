export function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Utilisateurs</h3>
          <p className="text-3xl font-bold text-blue-600">127</p>
          <p className="text-sm text-gray-500">Total des utilisateurs</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Jeux actifs</h3>
          <p className="text-3xl font-bold text-green-600">8</p>
          <p className="text-sm text-gray-500">Jeux en ligne</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Sessions</h3>
          <p className="text-3xl font-bold text-purple-600">342</p>
          <p className="text-sm text-gray-500">Sessions aujourd'hui</p>
        </div>
      </div>
    </div>
  );
}

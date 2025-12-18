import { Button } from "@repo/ui/components/ui/button";

function App() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Button onClick={() => console.log("Ça marche !")}>
        Mon bouton partagé
      </Button>
    </div>
  )
}

export default App
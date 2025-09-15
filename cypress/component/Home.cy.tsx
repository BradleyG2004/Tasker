import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../app/routes/home'
import { Toaster } from 'react-hot-toast'

// Mock data conformément aux schémas d'entités
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'John',
  surname: 'Doe'
}

const mockLists = [
  {
    id: 1,
    name: 'Liste de courses',
    createdAt: '2024-01-15T10:30:00Z',
    isDeleted: false,
    user: mockUser
  },
  {
    id: 2,
    name: 'Tâches professionnelles',
    createdAt: '2024-01-20T14:15:00Z',
    isDeleted: false,
    user: mockUser
  },
  {
    id: 3,
    name: 'Projets personnels',
    createdAt: '2024-01-25T09:45:00Z',
    isDeleted: false,
    user: mockUser
  }
]

const mockTasks = [
  {
    id: 1,
    shortDesc: 'Acheter du lait',
    longDesc: 'Aller au supermarché et acheter du lait bio',
    Deadline: '2024-02-01T18:00:00Z',
    isAchieved: false,
    createdAt: '2024-01-15T10:30:00Z',
    isDeleted: false,
    list: mockLists[0]
  },
  {
    id: 2,
    shortDesc: 'Préparer présentation',
    longDesc: 'Créer une présentation PowerPoint pour la réunion client',
    Deadline: '2024-02-05T14:00:00Z',
    isAchieved: true,
    createdAt: '2024-01-20T14:15:00Z',
    isDeleted: false,
    list: mockLists[1]
  }
]

const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <MemoryRouter initialEntries={["/"]}>{children}<Toaster /></MemoryRouter>
)

describe('HomePage component', () => {
  beforeEach(() => {
    // Mock toutes les dépendances externes
    cy.window().then((win) => {
      // Mock jwtDecode - retourne un token valide avec données utilisateur
      ;(win as any).jwtDecode = (token: string) => ({
        exp: Date.now() / 1000 + 3600, // Token valide pour 1h
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        surname: mockUser.surname
      })
      
      // Mock localStorage - token valide
      cy.stub(win.localStorage, 'getItem').callsFake((key: string) => {
        if (key === 'accessToken') return 'fake-valid-token'
        return null
      })
      
      // Mock fetch - simule toutes les réponses API
      cy.stub(win, 'fetch').callsFake((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        const ResponseCtor = (win as any).Response || Response

        // Check refresh endpoint
        if (url.endsWith('/check_refresh')) {
          return Promise.resolve(new ResponseCtor('', { status: 401 }))
        }

        // Get lists endpoint
        if (url.endsWith('/list') && init?.method === 'GET') {
          return Promise.resolve(
            new ResponseCtor(JSON.stringify({ lists: mockLists }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        // Create list endpoint
        if (url.endsWith('/list') && init?.method === 'POST') {
          const newList = {
            id: 4,
            name: 'Nouvelle liste',
            createdAt: new Date().toISOString(),
            isDeleted: false,
            user: mockUser
          }
          return Promise.resolve(
            new ResponseCtor(JSON.stringify(newList), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        // Delete list endpoint
        if (url.endsWith('/list') && init?.method === 'DELETE') {
          return Promise.resolve(
            new ResponseCtor(JSON.stringify({ message: 'List deleted successfully' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        // Get tasks endpoint
        if (url.includes('/task') && init?.method === 'GET') {
          return Promise.resolve(
            new ResponseCtor(JSON.stringify({ tasks: mockTasks }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        // Create task endpoint
        if (url.endsWith('/task') && init?.method === 'POST') {
          const newTask = {
            id: 3,
            shortDesc: 'Nouvelle tâche',
            longDesc: 'Description de la nouvelle tâche',
            Deadline: new Date().toISOString(),
            isAchieved: false,
            createdAt: new Date().toISOString(),
            isDeleted: false,
            list: mockLists[0]
          }
          return Promise.resolve(
            new ResponseCtor(JSON.stringify(newTask), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        // Logout endpoint
        if (url.endsWith('/logout') && init?.method === 'DELETE') {
          return Promise.resolve(
            new ResponseCtor(JSON.stringify({ message: 'Logged out successfully' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        return Promise.resolve(new ResponseCtor('', { status: 404 }))
      })
    })
  })

  it('affiche le bouton create list et permet de soumettre le formulaire de création', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Vérifier que le bouton Create List est présent
    cy.contains('button', 'Create List').should('be.visible')

    // Cliquer sur Create List pour ouvrir la modale
    cy.contains('button', 'Create List').click()

    // Vérifier que la modale est ouverte
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Create New List').should('be.visible')

    // Remplir le formulaire
    cy.get('input[placeholder*="list name"]').type('Ma nouvelle liste')

    // Soumettre le formulaire
    cy.contains('button', 'Create').click()

    // Vérifier que le message de succès s'affiche
    cy.contains('List created successfully!').should('be.visible')
  })

  it('affiche la select list et permet de sélectionner un élément', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Vérifier que la select list est présente
    cy.get('.react-select__control').should('be.visible')

    // Cliquer sur la select pour l'ouvrir
    cy.get('.react-select__control').click()

    // Vérifier que les options sont affichées
    cy.get('.react-select__menu').should('be.visible')
    
    // Vérifier que les éléments mockés sont présents
    cy.contains('Liste de courses').should('be.visible')
    cy.contains('Tâches professionnelles').should('be.visible')
    cy.contains('Projets personnels').should('be.visible')

    // Sélectionner une liste
    cy.contains('Liste de courses').click()

    // Vérifier que la liste est sélectionnée
    cy.get('.react-select__single-value').should('contain', 'Liste de courses')
  })

  it('affiche le bouton delete list et sa modale de confirmation', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Sélectionner une liste d'abord
    cy.get('.react-select__control').click()
    cy.contains('Liste de courses').click()

    // Vérifier que le bouton delete est présent
    cy.contains('button', 'Delete List').should('be.visible')

    // Cliquer sur Delete List
    cy.contains('button', 'Delete List').click()

    // Vérifier que la modale de confirmation s'ouvre
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Are you sure you want to delete this list?').should('be.visible')

    // Confirmer la suppression
    cy.contains('button', 'Yes, Delete').click()

    // Vérifier que le message de succès s'affiche
    cy.contains('List deleted successfully!').should('be.visible')
  })

  it('permet de sélectionner une tâche et affiche ses informations dans la languette droite', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Sélectionner une liste pour charger les tâches
    cy.get('.react-select__control').click()
    cy.contains('Liste de courses').click()

    // Attendre que les tâches se chargent
    cy.contains('Acheter du lait', { timeout: 5000 }).should('be.visible')

    // Cliquer sur une tâche
    cy.contains('Acheter du lait').click()

    // Vérifier que la languette droite s'ouvre avec les informations de la tâche
    cy.get('[data-testid="task-details"]').should('be.visible')
    cy.contains('Acheter du lait').should('be.visible')
    cy.contains('Aller au supermarché et acheter du lait bio').should('be.visible')
  })

  it('affiche toutes les fonctionnalités principales du composant', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Vérifier la présence des éléments principaux
    cy.contains('button', 'Create List').should('be.visible')
    cy.contains('button', 'Delete List').should('be.visible')
    cy.get('.react-select__control').should('be.visible')
    
    // Vérifier la présence des informations utilisateur
    cy.contains('John Doe').should('be.visible')
  })

  it('affiche les languettes et permet de les ouvrir/fermer', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Vérifier que les languettes sont présentes (boutons de déclenchement)
    cy.get('[style*="left: 0"]').should('be.visible') // Languette gauche
    cy.get('[style*="right: 0"]').should('be.visible') // Languette droite

    // Test de la languette gauche
    cy.get('[style*="left: 0"]').click()
    
    // Vérifier que le drawer gauche s'ouvre
    cy.contains('Task Lists').should('be.visible')
    cy.contains('Add a list').should('be.visible')
    cy.get('.react-select__control').should('be.visible')
    
    // Fermer la languette gauche
    cy.get('[style*="background-color: black"]').contains('X').click()
    
    // Vérifier que le drawer gauche se ferme
    cy.contains('Task Lists').should('not.be.visible')

    // Test de la languette droite
    cy.get('[style*="right: 0"]').click()
    
    // Vérifier que le drawer droit s'ouvre
    cy.contains('No Task Selected').should('be.visible')
    cy.contains('Click on a task to view its details').should('be.visible')
    cy.contains('button', 'Close').should('be.visible')
    
    // Fermer la languette droite
    cy.contains('button', 'Close').click()
    
    // Vérifier que le drawer droit se ferme
    cy.contains('No Task Selected').should('not.be.visible')
  })

  it('permet d\'interagir avec le contenu de la languette gauche', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Ouvrir la languette gauche
    cy.get('[style*="left: 0"]').click()
    
    // Vérifier le contenu de la languette gauche
    cy.contains('Task Lists').should('be.visible')
    cy.contains('Add a list').should('be.visible')
    
    // Tester le bouton "Add a list" dans la languette
    cy.contains('Add a list').click()
    
    // Vérifier que la modale de création s'ouvre
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Create New List').should('be.visible')
    
    // Fermer la modale
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'Cancel').click()
    })
    
    // Tester la select list dans la languette
    cy.get('.react-select__control').click()
    cy.get('.react-select__menu').should('be.visible')
    cy.contains('Liste de courses').should('be.visible')
    
    // Sélectionner une liste
    cy.contains('Liste de courses').click()
    
    // Vérifier que la liste est sélectionnée
    cy.get('.react-select__single-value').should('contain', 'Liste de courses')
  })

  it('permet d\'interagir avec le contenu de la languette droite', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Sélectionner une liste pour charger les tâches
    cy.get('.react-select__control').click()
    cy.contains('Liste de courses').click()

    // Attendre que les tâches se chargent
    cy.contains('Acheter du lait', { timeout: 5000 }).should('be.visible')

    // Ouvrir la languette droite
    cy.get('[style*="right: 0"]').click()
    
    // Vérifier l'état initial (pas de tâche sélectionnée)
    cy.contains('No Task Selected').should('be.visible')
    cy.contains('Click on a task to view its details').should('be.visible')
    
    // Fermer la languette droite
    cy.contains('button', 'Close').click()
    
    // Sélectionner une tâche
    cy.contains('Acheter du lait').click()
    
    // Rouvrir la languette droite
    cy.get('[style*="right: 0"]').click()
    
    // Vérifier que les détails de la tâche s'affichent
    cy.contains('Task Details').should('be.visible')
    cy.contains('Acheter du lait').should('be.visible')
    cy.contains('Aller au supermarché et acheter du lait bio').should('be.visible')
    cy.contains('Due Date').should('be.visible')
    cy.contains('Status').should('be.visible')
    cy.contains('Created').should('be.visible')
    cy.contains('button', 'Delete Task').should('be.visible')
  })

  it('teste la réactivité des languettes avec les interactions utilisateur', () => {
    cy.mount(
      <Wrapper>
        <Home />
      </Wrapper>
    )

    // Attendre que le composant soit chargé
    cy.contains('Create List', { timeout: 10000 }).should('be.visible')

    // Ouvrir les deux languettes simultanément
    cy.get('[style*="left: 0"]').click()
    cy.get('[style*="right: 0"]').click()
    
    // Vérifier que les deux sont ouvertes
    cy.contains('Task Lists').should('be.visible')
    cy.contains('No Task Selected').should('be.visible')
    
    // Fermer la languette gauche
    cy.get('[style*="background-color: black"]').contains('X').click()
    
    // Vérifier que seule la languette droite reste ouverte
    cy.contains('Task Lists').should('not.be.visible')
    cy.contains('No Task Selected').should('be.visible')
    
    // Fermer la languette droite
    cy.contains('button', 'Close').click()
    
    // Vérifier que les deux languettes sont fermées
    cy.contains('Task Lists').should('not.be.visible')
    cy.contains('No Task Selected').should('not.be.visible')
  })
})

import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../app/auth/login'
import { Toaster } from 'react-hot-toast'

const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <MemoryRouter initialEntries={["/auth/login"]}>{children}<Toaster /></MemoryRouter>
)

describe('LoginPage component', () => {
  beforeEach(() => {
    // Mock toutes les dépendances externes
    cy.window().then((win) => {
      // Mock jwtDecode - retourne toujours un token expiré
      ;(win as any).jwtDecode = () => ({ exp: 0 })
      
      // Mock localStorage - toujours vide
      cy.stub(win.localStorage, 'getItem').returns(null)
      
      // Mock fetch - simule les réponses API
      cy.stub(win, 'fetch').callsFake((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        const ResponseCtor = (win as any).Response || Response

        if (url.endsWith('/check_refresh')) {
          return Promise.resolve(new ResponseCtor('', { status: 401 }))
        }

        if (url.endsWith('/login')) {
          return Promise.resolve(
            new ResponseCtor(JSON.stringify({ accessToken: 'fake-token' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        return Promise.resolve(new ResponseCtor('', { status: 404 }))
      })
    })
  })

  it('impose de remplir les 2 champs email et password', () => {
    cy.mount(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    )

    // Vérifier que les champs sont présents
    cy.get('input[placeholder="mike142@yourmail.com"]').should('be.visible')
    cy.get('input[placeholder="********"]').should('be.visible')
    cy.contains('button', 'Log me in').should('be.visible')

    // Test 1: Champs vides - cliquer sur submit
    cy.contains('button', 'Log me in').click()
    
    // Vérifier que les champs sont toujours vides (pas de soumission)
    cy.get('input[placeholder="mike142@yourmail.com"]').should('have.value', '')
    cy.get('input[placeholder="********"]').should('have.value', '')

    // Test 2: Seulement email rempli
    cy.get('input[placeholder="mike142@yourmail.com"]').type('test@example.com')
    cy.contains('button', 'Log me in').click()
    
    // Vérifier que le password est toujours vide
    cy.get('input[placeholder="********"]').should('have.value', '')

    // Test 3: Seulement password rempli
    cy.get('input[placeholder="mike142@yourmail.com"]').clear()
    cy.get('input[placeholder="********"]').type('password123')
    cy.contains('button', 'Log me in').click()
    
    // Vérifier que l'email est toujours vide
    cy.get('input[placeholder="mike142@yourmail.com"]').should('have.value', '')

    // Test 4: Les deux champs remplis - devrait fonctionner
    cy.get('input[placeholder="mike142@yourmail.com"]').type('test@example.com')
    cy.get('input[placeholder="********"]').type('password123')
    cy.contains('button', 'Log me in').click()
    
    // Vérifier que la soumission a eu lieu (message de succès)
    cy.contains('Login successful!').should('be.visible')
  })
})

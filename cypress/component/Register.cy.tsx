import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../app/auth/register'
import { Toaster } from 'react-hot-toast'

const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <MemoryRouter initialEntries={["/auth/register"]}>{children}<Toaster /></MemoryRouter>
)

describe('RegisterPage component', () => {
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

        if (url.endsWith('/signup')) {
          return Promise.resolve(
            new ResponseCtor(JSON.stringify({ ok: true }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        }

        return Promise.resolve(new ResponseCtor('', { status: 404 }))
      })
    })
  })

  it('affiche les erreurs de validation pour emails et mots de passe non concordants', () => {
    cy.mount(
      <Wrapper>
        <RegisterPage />
      </Wrapper>
    )

    // Remplir les champs minimaux
    cy.get('input[placeholder="Your name"]').type('John')
    cy.get('input[placeholder="Your surname"]').type('Doe')

    // Email non concordant
    cy.get('input[placeholder="mike142@yourmail.com"]').eq(0).type('john@example.com')
    cy.get('input[placeholder="mike142@yourmail.com"]').eq(1).type('john2@example.com')

    // Mot de passe non concordant
    cy.get('input[placeholder="********"]').eq(0).type('Password1!')
    cy.get('input[placeholder="********"]').eq(1).type('Password2!')

    cy.contains('button', 'Register').click()

    cy.contains('Emails do not match!').should('be.visible')

    // Corriger les emails, garder le mot de passe non concordant
    cy.get('input[placeholder="mike142@yourmail.com"]').eq(1).clear().type('john@example.com')
    cy.contains('button', 'Register').click()
    cy.contains('Passwords do not match!').should('be.visible')
  })

  it('soumet avec succès et affiche le toast de succès', () => {
    cy.mount(
      <Wrapper>
        <RegisterPage />
      </Wrapper>
    )

    cy.get('input[placeholder="Your name"]').type('Jane')
    cy.get('input[placeholder="Your surname"]').type('Smith')
    cy.get('input[placeholder="mike142@yourmail.com"]').eq(0).type('jane@example.com')
    cy.get('input[placeholder="mike142@yourmail.com"]').eq(1).type('jane@example.com')
    cy.get('input[placeholder="********"]').eq(0).type('Password1!')
    cy.get('input[placeholder="********"]').eq(1).type('Password1!')

    cy.contains('button', 'Register').click()

    cy.contains('Registration successful!').should('be.visible')
  })

  it('affiche le formulaire avec tous les champs requis', () => {
    cy.mount(
      <Wrapper>
        <RegisterPage />
      </Wrapper>
    )

    // Vérifier que tous les champs sont présents
    cy.get('input[placeholder="Your name"]').should('be.visible')
    cy.get('input[placeholder="Your surname"]').should('be.visible')
    cy.get('input[placeholder="mike142@yourmail.com"]').should('have.length', 2)
    cy.get('input[placeholder="********"]').should('have.length', 2)
    cy.contains('button', 'Register').should('be.visible')
    cy.contains('Log me in').should('be.visible')
  })
})
# Git Workflow

Questo documento descrive il workflow Git da seguire per tutte le implementazioni di questo progetto.

## Setup Iniziale

### Creazione repository
```bash
# Inizializza il repository locale
git init

# Aggiungi il remote GitHub
git remote add origin https://github.com/[username]/[nome-progetto].git

# Crea il branch principale
git checkout -b main
```

### File .gitignore
Assicurarsi che `.gitignore` includa:
```
# IDE
.idea/
.vscode/
*.sublime-*

# macOS
.DS_Store

# Windows
Thumbs.db

# Node (se usato)
node_modules/
package-lock.json

# Environment
.env
.env.local
```

## Branch Strategy

### Branch principali
- `main` - Codice stabile, pronto per release
- `develop` - Branch di integrazione per lo sviluppo

### Branch di lavoro
Per ogni nuova funzionalità o fix, creare un branch dedicato:

```bash
# Formato nome branch
feature/[nome-funzionalita]    # Nuove funzionalità
fix/[nome-bug]                 # Correzione bug
refactor/[nome-area]           # Refactoring
docs/[nome-documento]          # Documentazione
```

### Esempi
```bash
git checkout -b feature/nuova-funzionalita
git checkout -b feature/sistema-audio
git checkout -b fix/collisione-nemici
git checkout -b refactor/game-loop
```

## Workflow per Nuove Implementazioni

### 1. Aggiornare il branch locale
```bash
# Assicurarsi di partire da develop aggiornato
git checkout develop
git pull origin develop
```

### 2. Creare branch di lavoro
```bash
git checkout -b feature/nome-funzionalita
```

### 3. Sviluppo iterativo
```bash
# Commit frequenti e atomici
git add [file-modificati]
git commit -m "tipo: descrizione breve

Descrizione più dettagliata se necessario"
```
Se c’è una issue di riferimento, l'eventuale discussione prima o durante o dopo l’implementazione, deve essere interamente riportata come commento nella issue.

### 4. Tipi di commit (Conventional Commits)
- `feat:` - Nuova funzionalità
- `fix:` - Correzione bug
- `refactor:` - Refactoring senza cambi funzionali
- `style:` - Formattazione, nessun cambio di codice
- `docs:` - Solo documentazione
- `test:` - Aggiunta o modifica test
- `chore:` - Manutenzione, dipendenze, configurazione

### Esempi di commit
```bash
git commit -m "feat: aggiunge sistema power-up"
git commit -m "fix: corregge collisione con piattaforme"
git commit -m "refactor: estrae logica audio in modulo dedicato"
git commit -m "docs: aggiorna CLAUDE.md con nuovi requisiti"
```

### 5. Push del branch
```bash
git push -u origin feature/nome-funzionalita
```


### 6. Creare Pull Request
- Andare su GitHub
- Creare Pull Request da `feature/nome-funzionalita` verso `develop`
- Compilare template PR con:
  - Descrizione delle modifiche
  - Screenshot se ci sono cambiamenti UI
  - Checklist di test effettuati

### 7. Review e Merge
- Attendere review (se applicabile)
- Risolvere eventuali conflitti
- Merge della PR
- Eliminare il branch di feature

```bash
# Dopo il merge, localmente
git checkout develop
git pull origin develop
git branch -d feature/nome-funzionalita
```

## Release Workflow

### Preparazione release
```bash
# Creare branch di release da develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
```

### Finalizzazione
```bash
# Aggiornare CHANGELOG.md
git commit -m "chore: prepara release v1.0.0"
```

### Merge in main
```bash
# Merge in main
git checkout main
git merge release/v1.0.0

# Tag della versione
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# Merge back in develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# Eliminare branch release
git branch -d release/v1.0.0
```

## Hotfix Workflow

Per correzioni urgenti in produzione:

```bash
# Creare branch hotfix da main
git checkout main
git checkout -b hotfix/nome-fix

# Applicare fix e commit
git commit -m "fix: descrizione fix urgente"

# Merge in main
git checkout main
git merge hotfix/nome-fix
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin main --tags

# Merge in develop
git checkout develop
git merge hotfix/nome-fix
git push origin develop
```

## Best Practices

### Commit
- Commit piccoli e frequenti
- Un commit = una modifica logica
- Messaggi chiari e descrittivi
- Non committare codice commentato
- Non committare file di debug o log

### Branch
- Tenere i branch di feature di breve durata (max 1-2 settimane)
- Aggiornare frequentemente da develop per evitare conflitti
- Un branch = una funzionalità

### Pull Request
- Descrizione chiara delle modifiche
- Link a eventuali issue correlate
- Screenshot per modifiche UI
- Assicurarsi che il codice compili senza errori
- Testare su almeno una piattaforma prima della PR

### Sicurezza
- MAI committare dati sensibili (credenziali, API keys)
- Usare `.gitignore` appropriatamente
- Verificare i file prima di ogni commit

## Comandi Utili

```bash
# Vedere lo stato dei file
git status

# Vedere la cronologia
git log --oneline --graph

# Annullare modifiche non committate
git checkout -- [file]

# Stash temporaneo
git stash
git stash pop

# Vedere differenze
git diff
git diff --staged

# Aggiornare branch con rebase (mantiene storia lineare)
git checkout feature/mia-feature
git rebase develop
```

## Struttura Repository GitHub

```
progetto/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── docs/
│   └── GIT_WORKFLOW.md
├── js/
│   └── ... (codice JavaScript)
├── css/
│   └── ... (stili)
├── .gitignore
├── CLAUDE.md
├── CHANGELOG.md
├── LICENSE
├── README.md
└── index.html
```

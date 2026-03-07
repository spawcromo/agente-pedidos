# Antigravity Starter Kit

[English](#english) | [Español](#español)

---

## English

A minimal, robust framework for building end-to-end products using agentic AI. This starter kit is designed to accelerate delivery from discovery to deployment while maintaining institutional-grade standards.

### Core Principles

- **Ship Working Software**: Prioritize functional delivery over academic theory.
- **Minimal Over-engineering**: Avoid complex infrastructure unless explicitly required by business needs.
- **Trunk-Based Development**: Simplified Git workflow focusing on speed and continuous integration.
- **End-to-End Governance**: Unified rules for discovery, requirements, architecture, and code.

### Directory Structure

```text
.agent/
├── rules/        # Persistent guardrails for code, git, and delivery standards.
├── skills/       # Specialized capabilities for distinct project phases.
└── workflows/    # Standard operating procedures (slash commands).

docs/             # Unified project documentation (Discovery, Requirements, Architecture, Plan).
frontend/         # Client-side application source.
backend/          # Server-side API and database source.
automations/      # Workflow documentation (e.g., n8n, custom scripts).
```

### Workflows (Slash Commands)

To use this starter kit, invoke the following workflows through your AI agent:

#### 1. `/new-project-kickoff`
**When**: Starting a new client project.
**What**: Initializes the repository, defines project context, and orchestrates the discovery-to-scaffold pipeline.
**Output**: Initial project structure with documentation and working boilerplate.

#### 2. `/feature-cycle`
**When**: Implementing any new feature or fix.
**What**: Orchestrates the branch-define-implement-test-merge cycle.
**Output**: Production-ready code merged into the `main` branch.

#### 3. `/deploy`
**When**: Releasing code to staging or production.
**What**: Performs builds, runs migrations, verifies environment variables, and executes smoke tests.
**Output**: Live application on the target environment.

### Phase Overview (Skills)

| Phase | Purpose | Output |
| :--- | :--- | :--- |
| **Discovery** | Problem definition and MVP scope. | `docs/discovery.md` |
| **Requirements** | Functional user stories and constraints. | `docs/requirements.md` |
| **Architecture** | Technical design and tech stack mapping. | `docs/architecture.md` |
| **Planning** | Milestone definition and ordered backlog. | `docs/plan.md` |
| **Scaffolding** | Base code generation for FE and BE. | `frontend/`, `backend/` |

### Getting Started

1. Copy the **contents** of the `project-template` directory to the root of your new project.
2. Initialize Git and define your project in `.agent/rules/01-project-context.md`.
3. Invoke `/new-project-kickoff` to begin the structured discovery process.
4. Follow the instructions provided by the agent to move through the delivery pipeline.

---

## Español

Un framework mínimo y robusto para construir productos end-to-end usando IA agéntica. Este starter kit está diseñado para acelerar la entrega desde el discovery hasta el despliegue, manteniendo estándares profesionales.

### Principios Core

- **Software que Funciona Primero**: Priorizar la entrega funcional sobre la teoría académica.
- **Sobre-ingeniería Mínima**: Evitar infraestructura compleja a menos que las necesidades de negocia lo justifiquen explícitamente.
- **Desarrollo Basado en Trunk**: Workflow de Git simplificado enfocado en velocidad e integración continua.
- **Gobernanza End-to-End**: Reglas unificadas para discovery, requerimientos, arquitectura y código.

### Estructura de Directorios

```text
.agent/
├── rules/        # Guardrails persistentes para código, git y estándares de entrega.
├── skills/       # Capacidades especializadas para distintas fases del proyecto.
└── workflows/    # Procedimientos operativos estándar (slash commands).

docs/             # Documentación unificada (Discovery, Requirements, Architecture, Plan).
frontend/         # Código fuente de la aplicación cliente.
backend/          # Código fuente de la API y base de datos.
automations/      # Documentación de flujos de trabajo (n8n, scripts, etc).
```

### Workflows (Slash Commands)

Para usar este starter kit, invoca los siguientes flujos a través de tu agente de IA:

#### 1. `/new-project-kickoff`
**Cuándo**: Al empezar un nuevo proyecto de cliente.
**Qué**: Inicializa el repositorio, define el contexto del proyecto y orquesta el pipeline de discovery-a-scaffold.
**Resultado**: Estructura inicial con documentación y boilerplate funcional.

#### 2. `/feature-cycle`
**Cuándo**: Al implementar cualquier feature o arreglo (fix).
**Qué**: Orquesta el ciclo de branch-define-implement-test-merge.
**Resultado**: Código listo para producción fusionado en la rama `main`.

#### 3. `/deploy`
**Cuándo**: Al liberar código a staging o producción.
**Qué**: Realiza builds, corre migraciones, verifica variables de entorno y ejecuta smoke tests.
**Resultado**: Aplicación en vivo en el entorno de destino.

### Resumen de Fases (Skills)

| Fase | Propósito | Resultado |
| :--- | :--- | :--- |
| **Discovery** | Definición del problema y scope del MVP. | `docs/discovery.md` |
| **Requirements** | Historias de usuario funcionales y restricciones. | `docs/requirements.md` |
| **Architecture** | Diseño técnico y mapeo del stack tecnológico. | `docs/architecture.md` |
| **Planning** | Definición de milestones y backlog ordenado. | `docs/plan.md` |
| **Scaffolding** | Generación de código base para FE y BE. | `frontend/`, `backend/` |

### Cómo Empezar

1. Copia el **contenido** del directorio `project-template` a la raíz de tu nuevo proyecto.
2. Inicializa Git y define tu proyecto en `.agent/rules/01-project-context.md`.
3. Invoca `/new-project-kickoff` para comenzar el proceso estructurado de discovery.
4. Sigue las instrucciones del agente para avanzar a través del pipeline de entrega.

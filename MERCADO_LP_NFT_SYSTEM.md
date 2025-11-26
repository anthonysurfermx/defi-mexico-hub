# 🏆 Sistema de NFT para Mercado LP

## Resumen

Sistema completo de recompensa NFT que incentiva a los jugadores a completar el Nivel 4 del juego educativo Mercado LP. Cuando el jugador alcanza el nivel requerido, se le invita a iniciar sesión y reclamar un NFT educativo gratuito que certifica su conocimiento en DeFi.

---

## ✅ Implementación Completada

### 1. Componente NFT Claim Modal
**Archivo**: `/src/components/games/mercado-lp/components/NFTClaimModal.tsx`

**Características**:
- ✅ Modal pixel-art coherente con el juego
- ✅ Preview animado del NFT
- ✅ Checklist de requisitos (Nivel 4 + 1000 XP + Login)
- ✅ Estado bloqueado/desbloqueado
- ✅ Integración con sistema de autenticación
- ✅ Redirección a login con return URL
- ✅ Confetti burst al reclamar

**Requisitos para Claim**:
```typescript
- Completar Nivel 4: Subastero ✅
- Alcanzar 1000 XP ✅
- Estar autenticado ✅
```

### 2. Detección Automática de Completación
**Archivo**: `/src/pages/MercadoLPGamePage.tsx`

**Lógica**:
```typescript
useEffect(() => {
  const hasCompletedLevel4 = player.level >= 4 && player.xp >= 1000;
  const modalAlreadyShown = localStorage.getItem('mercado_lp_nft_modal_shown');

  if (hasCompletedLevel4 && !hasShownNFTModal && !modalAlreadyShown) {
    // Mostrar modal después de 2 segundos
    setTimeout(() => {
      setShowNFTModal(true);
      setHasShownNFTModal(true);
      localStorage.setItem('mercado_lp_nft_modal_shown', 'true');
    }, 2000);
  }
}, [player.level, player.xp, hasShownNFTModal]);
```

**Features**:
- ✅ Se muestra automáticamente cuando se completa Nivel 4
- ✅ Delay de 2 segundos para mejor UX
- ✅ Solo se muestra una vez (localStorage flag)
- ✅ Se resetea si el usuario limpia localStorage

### 3. Base de Datos Supabase
**Schema**: `supabase-mercado-lp-nft-schema.sql`

#### Tabla: `mercado_lp_nft_claims`

```sql
CREATE TABLE mercado_lp_nft_claims (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nft_type VARCHAR(50) DEFAULT 'mercado_lp_maestro',
  token_id VARCHAR(255),
  contract_address VARCHAR(255),
  chain VARCHAR(50) DEFAULT 'base',
  claim_status VARCHAR(20) DEFAULT 'pending', -- pending, minting, completed, failed
  player_level INTEGER NOT NULL,
  player_xp INTEGER NOT NULL,
  total_swaps INTEGER,
  total_lp_provided DECIMAL(18, 2),
  tokens_created INTEGER,
  metadata JSONB,
  tx_hash VARCHAR(255),
  claimed_at TIMESTAMPTZ,
  minted_at TIMESTAMPTZ,
  -- ...
);
```

**Características**:
- ✅ RLS habilitado para seguridad
- ✅ Snapshot de stats del jugador al momento del claim
- ✅ Metadata del NFT en formato OpenSea
- ✅ Tracking de status del minting
- ✅ Unique constraint: 1 NFT por usuario

#### Funciones RPC:

**`can_claim_mercado_lp_nft(user_id)`**
- Verifica si el usuario cumple requisitos
- Chequea nivel >= 4 y XP >= 1000
- Verifica que no haya reclamado previamente

**`create_nft_claim(user_id)`**
- Crea el registro de claim
- Hace snapshot de las stats del jugador
- Genera metadata del NFT
- Retorna el ID del claim

### 4. Servicio de NFT
**Archivo**: `/src/components/games/mercado-lp/lib/nft.ts`

**Funciones Principales**:

```typescript
// Verificar si puede reclamar
async function canClaimNFT(): Promise<boolean>

// Verificar si ya reclamó
async function hasClaimedNFT(): Promise<boolean>

// Obtener claim del usuario
async function getUserNFTClaim(): Promise<NFTClaim | null>

// Crear claim (llamado desde el modal)
async function createNFTClaim(): Promise<string | null>

// Actualizar status (backend/admin)
async function updateNFTClaimStatus(
  claimId: string,
  status: 'minting' | 'completed' | 'failed',
  tokenId?: string,
  contractAddress?: string,
  txHash?: string
): Promise<boolean>
```

---

## 🔄 Flujo Completo

### 1. Usuario Juega
```
Usuario juega Mercado LP
  ↓
Completa niveles 1, 2, 3
  ↓
Completa Nivel 4: Subastero
  ↓
Alcanza 1000+ XP
```

### 2. Modal Aparece
```
Sistema detecta completación
  ↓
Espera 2 segundos
  ↓
Muestra NFTClaimModal
  ↓
Usuario ve preview del NFT
```

### 3. Decisión del Usuario

#### Opción A: Usuario NO está autenticado
```
Click "Iniciar Sesión para Reclamar"
  ↓
localStorage.setItem('mercado_lp_pending_nft_claim', 'true')
  ↓
Redirect a /login
  ↓
Después de login exitoso → Redirect de vuelta al juego
  ↓
Modal se vuelve a mostrar
  ↓
Ahora puede reclamar
```

#### Opción B: Usuario SÍ está autenticado
```
Click "¡Reclamar NFT Gratis!"
  ↓
createNFTClaim() llamado
  ↓
RPC: create_nft_claim(user_id)
  ↓
Registro creado en DB (status: pending)
  ↓
initiateMinting() disparado
  ↓
Status actualizado a 'minting'
  ↓
Toast: "Tu NFT se está procesando... ¡Revisa tu email!"
  ↓
Modal se cierra después de 3 segundos
```

### 4. Proceso de Minting (Backend - TODO)
```
Backend service escucha nuevos claims (status: pending)
  ↓
Genera metadata del NFT
  ↓
Sube imagen/metadata a IPFS
  ↓
Llama smart contract para mint
  ↓
Obtiene token_id y tx_hash
  ↓
Actualiza DB: updateNFTClaimStatus()
  ↓
Status: 'completed'
  ↓
Envía email al usuario con link al NFT
```

---

## 📊 Metadata del NFT

El NFT contiene la siguiente información del jugador:

```json
{
  "name": "Mercado LP Maestro",
  "description": "Completó todos los niveles del juego educativo Mercado LP",
  "image": "ipfs://QmXXXXXX...",
  "attributes": [
    {
      "trait_type": "Nivel",
      "value": 4
    },
    {
      "trait_type": "XP Total",
      "value": 1250
    },
    {
      "trait_type": "Swaps Completados",
      "value": 45
    },
    {
      "trait_type": "Tokens Creados",
      "value": 3
    }
  ]
}
```

---

## 🔐 Seguridad

### RLS Policies
```sql
-- Usuarios solo ven sus propios claims
CREATE POLICY "Users can view own NFT claims"
  ON mercado_lp_nft_claims
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios solo pueden crear sus propios claims
CREATE POLICY "Users can create own NFT claims"
  ON mercado_lp_nft_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todos
CREATE POLICY "Admins can view all NFT claims"
  ON mercado_lp_nft_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Validaciones
- ✅ Verificación de requisitos antes de claim
- ✅ Unique constraint previene duplicados
- ✅ RPC function valida permisos
- ✅ Snapshot de stats previene manipulación

---

## 🚀 Próximos Pasos

### 1. Ejecutar Schema en Supabase
```bash
# Ir a Supabase Dashboard > SQL Editor
# Ejecutar: supabase-mercado-lp-nft-schema.sql
```

### 2. Implementar Backend de Minting

**Opciones**:

#### A. Cloudflare Workers + Web3.js
```typescript
// worker.ts
import Web3 from 'web3';

export default {
  async fetch(request: Request) {
    // Listen for new NFT claims
    // Mint NFT on Base
    // Update Supabase with token_id
  }
}
```

#### B. Thirdweb Engine
```typescript
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

const sdk = new ThirdwebSDK("base");
const contract = await sdk.getContract(CONTRACT_ADDRESS);

await contract.erc721.mintTo(userWallet, metadata);
```

#### C. NFT.Storage + Base
```typescript
import { NFTStorage } from 'nft.storage';

// Upload to IPFS
const metadata = await client.store({
  name: 'Mercado LP Maestro',
  description: '...',
  image: imageFile
});

// Mint on Base
// ...
```

### 3. Email Notifications
```typescript
// Después de mint exitoso
await sendEmail({
  to: user.email,
  template: 'nft-minted',
  data: {
    nftName: 'Mercado LP Maestro',
    tokenId: claim.token_id,
    openseaUrl: `https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`,
    basescanUrl: `https://basescan.org/tx/${txHash}`
  }
});
```

### 4. Página de Dashboard de NFTs
Crear página en `/academia/mis-nfts` para:
- Ver NFTs reclamados
- Status de minting
- Links a OpenSea/Basescan
- Descargar certificado PDF

### 5. Social Sharing
```typescript
// Botón para compartir en Twitter
const shareText = `¡Completé Mercado LP y gané este NFT educativo! 🏆

Aprendí sobre AMMs, Liquidity Providing, Token Creation y Auctions.

Juega gratis: https://defihubmexico.com/academia/juego/mercado-lp

#DeFi #Web3Education`;

// Twitter share URL
const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
```

---

## 📁 Archivos Creados

1. **`NFTClaimModal.tsx`** - Componente del modal
2. **`nft.ts`** - Servicio de NFT claims
3. **`supabase-mercado-lp-nft-schema.sql`** - Schema de DB
4. **`MercadoLPGamePage.tsx`** - Updated con lógica de detección

---

## 🎨 Ejemplo de Uso

```tsx
// En cualquier componente
import { NFTClaimModal } from '@/components/games/mercado-lp/components/NFTClaimModal';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';

function MyComponent() {
  const { user } = useAuth();
  const { player } = useGame();
  const [showModal, setShowModal] = useState(false);

  return (
    <NFTClaimModal
      open={showModal}
      onClose={() => setShowModal(false)}
      isAuthenticated={!!user}
      playerLevel={player.level}
      playerXP={player.xp}
    />
  );
}
```

---

## 📊 Analytics Sugeridos

Track eventos importantes:
```typescript
// NFT modal shown
analytics.track('mercado_lp_nft_modal_shown', {
  player_level: player.level,
  player_xp: player.xp,
  is_authenticated: !!user
});

// User clicked claim
analytics.track('mercado_lp_nft_claim_attempted', {
  user_id: user?.id,
  player_stats: {...}
});

// Claim successful
analytics.track('mercado_lp_nft_claimed', {
  claim_id: claimId,
  user_id: user.id
});

// NFT minted successfully
analytics.track('mercado_lp_nft_minted', {
  claim_id: claimId,
  token_id: tokenId,
  tx_hash: txHash
});
```

---

**Autor**: Claude (Anthropic)
**Fecha**: Noviembre 2024
**Proyecto**: DeFi Hub Mexico - Mercado LP NFT Reward System

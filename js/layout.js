// NAIJA LIFE - Phase 1 district layout (local metres: x = east, z = south, y = up).
// Hand-built and Abuja-INSPIRED. It is NOT geographically verified.
export const LAYOUT = {
  size: 300,
  bounds: 145,
  spawn: { x: 12, z: 14, camYaw: Math.PI },
  roads: [
    { id: 'main-ave',  name: 'Main Avenue',   axis: 'x', at: 0,   width: 16, from: -150, to: 150 },
    { id: 'garden-st', name: 'Garden Street', axis: 'x', at: -80, width: 10, from: -150, to: 150 },
    { id: 'unity-rd',  name: 'Unity Road',    axis: 'z', at: 0,   width: 12, from: -150, to: 150 },
    { id: 'market-rd', name: 'Market Road',   axis: 'z', at: 80,  width: 10, from: -150, to: 150 }
  ],
  parks: [
    { id: 'unity-park',      name: 'Unity Park',      x: -80, z: -115, w: 60, d: 50 },
    { id: 'central-gardens', name: 'Central Gardens', x: 45,  z: -115, w: 60, d: 50 }
  ],
  landmark: { id: 'national-mosque', name: 'National Mosque (inspired)', x: 40, z: 60, size: 30 },
  buildings: [
    { id: 'jabi-tower',      name: 'Jabi Tower',        kind: 'apartment',  x: 25,  z: -35, w: 18, d: 18, h: 40, color: '#a9bccf', label: true },
    { id: 'wuse-mall',       name: 'Wuse Mall',         kind: 'retail',     x: 55,  z: -30, w: 26, d: 20, h: 14, color: '#f0e2c8', label: true },
    { id: 'garki-offices',   name: 'Garki Offices',     kind: 'office',     x: 30,  z: -62, w: 20, d: 12, h: 22, color: '#8fa6bd' },
    { id: 'central-clinic',  name: 'Central Clinic',    kind: 'public',     x: 62,  z: -62, w: 16, d: 12, h: 10, color: '#f4f6f6', label: true },
    { id: 'maitama-villa',   name: 'Maitama Villa',     kind: 'house',      x: -25, z: -30, w: 16, d: 14, h: 9,  color: '#efe3cf' },
    { id: 'duplex-a',        name: 'Duplex A',          kind: 'house',      x: -52, z: -30, w: 12, d: 12, h: 8,  color: '#e6c9a8' },
    { id: 'duplex-b',        name: 'Duplex B',          kind: 'house',      x: -25, z: -56, w: 12, d: 12, h: 8,  color: '#d9e3c8' },
    { id: 'school',          name: 'Community School',  kind: 'public',     x: -62, z: -58, w: 24, d: 14, h: 7,  color: '#f3d9a4', label: true },
    { id: 'suya-spot',       name: 'Suya Spot',         kind: 'food',       x: 18,  z: 22,  w: 8,  d: 6,  h: 4.5, color: '#e86a33', label: true },
    { id: 'atm',             name: 'Bank ATM',          kind: 'bank',       x: 64,  z: 20,  w: 3,  d: 3,  h: 3.2, color: '#1f7a4d', label: true },
    { id: 'utako-apts',      name: 'Utako Apartments',  kind: 'apartment',  x: -35, z: 45,  w: 22, d: 16, h: 26, color: '#c9b7a1' },
    { id: 'asokoro-mansion', name: 'Asokoro Mansion',   kind: 'house',      x: -80, z: 55,  w: 20, d: 16, h: 10, color: '#f1ece0' },
    { id: 'corner-cafe',     name: 'Corner Cafe',       kind: 'food',       x: -22, z: 20,  w: 10, d: 8,  h: 5,  color: '#7b4b2a', label: true },
    { id: 'petrol',          name: 'Petrol Station',    kind: 'fuel',       x: -70, z: 22,  w: 14, d: 8,  h: 5,  color: '#d6402e', label: true },
    { id: 'business-complex',name: 'Business Complex',  kind: 'office',     x: 112, z: -35, w: 30, d: 22, h: 30, color: '#9db2c4', label: true },
    { id: 'warehouse',       name: 'Warehouse',         kind: 'industrial', x: 112, z: 50,  w: 30, d: 20, h: 8,  color: '#b0b4b8' }
  ],
  interactables: [
    { id: 'suya', x: 18, z: 26.5, r: 3.2, label: 'Buy suya (₦1,500)' },
    { id: 'atm',  x: 64, z: 23.5, r: 3,   label: 'Use ATM' }
  ]
};
     

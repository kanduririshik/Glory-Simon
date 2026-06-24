import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Layers, 
  Compass, 
  Copy, 
  Check 
} from 'lucide-react';
import { GlassCard } from '../components/ui/Card';
import { useNotifications } from '../context/NotificationContext';

export const DesignStudioPage: React.FC = () => {
  const { addToast } = useNotifications();

  // Active Category tabs
  const [activeMaterialTab, setActiveMaterialTab] = useState<'marble' | 'wood' | 'paint' | 'lighting' | 'furniture'>('marble');
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string>('all');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Room Categories Sourcing
  const roomCategories = [
    { id: 'all', label: 'All Spaces' },
    { id: 'living', label: 'Living Room' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'dining', label: 'Dining' },
    { id: 'office', label: 'Office' },
    { id: 'commercial', label: 'Commercial' }
  ];

  // Colors Palette Sourcing
  const colorSystem = [
    { name: 'Warm Alabaster', hex: '#FFF8F0', desc: 'Primary atmospheric glow' },
    { name: 'Champagne Satin', hex: '#F6E7C1', desc: 'Luxury metallic accent' },
    { name: 'Raw Terracotta', hex: '#C76B4F', desc: 'Organic earth framing' },
    { name: 'Aged Bronze', hex: '#8B7355', desc: 'Hardware and wood structures' },
    { name: 'Emerald Leaf', hex: '#4E7A65', desc: 'Botanical accentuation' },
    { name: 'Calacatta Gold', hex: '#FFFBF5', desc: 'Luxury marble reflection' }
  ];

  // Material Collections
  const marbleCollection = [
    { name: 'Calacatta Gold', source: 'Carrara, Italy', textureBg: 'linear-gradient(135deg, #FFF 60%, #E3C185 85%, #BFA572 100%)', price: '$$$' },
    { name: 'Nero Marquina', source: 'Basque Country, Spain', textureBg: 'linear-gradient(135deg, #1A1A1A 70%, #FFF 80%, #1A1A1A 90%)', price: '$$' },
    { name: 'Verde Alpi', source: 'Aosta Valley, Italy', textureBg: 'linear-gradient(135deg, #1e3a2f 50%, #4E7A65 80%, #0f1d18 100%)', price: '$$$$' },
    { name: 'Rosa Portogallo', source: 'Estremoz, Portugal', textureBg: 'linear-gradient(135deg, #fcece6 40%, #D99A6C 75%, #FFF 100%)', price: '$$$' }
  ];

  const woodCollection = [
    { name: 'Smoked Oak', finish: 'Brushed Matt', colorBg: 'bg-[#3b2f2f]', price: '$$' },
    { name: 'Royal Walnut', finish: 'Satin Lacquer', colorBg: 'bg-[#4d3a2a]', price: '$$$$' },
    { name: 'Honey Teak', finish: 'Natural Oil', colorBg: 'bg-[#805a36]', price: '$$$' },
    { name: 'Bleached Ash', finish: 'White Wash', colorBg: 'bg-[#d6c7b6]', price: '$$' }
  ];

  const lightingCollection = [
    { name: 'Ambient Cove', type: '2700K Soft Glow', colorBg: 'bg-gradient-to-r from-amber-100 to-amber-200 shadow-lg', price: '$$' },
    { name: 'Architectural Spot', type: 'High CRI Halogen', colorBg: 'bg-white border border-slate-200', price: '$$' },
    { name: 'Bespoke Chandelier', type: 'Murano Handblown', colorBg: 'bg-gradient-to-tr from-yellow-200 via-orange-100 to-white', price: '$$$$$' }
  ];

  const furnitureCollection = [
    { name: 'Silk Velvet Sofa', desc: 'Bespoke lounge cushions', colorBg: 'bg-[#6b5b43]', price: '$$$$' },
    { name: 'Belgian Linen Chair', desc: 'Natural texturing', colorBg: 'bg-[#e3dac9]', price: '$$' },
    { name: 'Saddle Leather Atelier', desc: 'Handstitched edges', colorBg: 'bg-[#915f38]', price: '$$$$' }
  ];

  interface InspirationItem {
    title: string;
    room: string;
    image: string;
    details: string;
    designer: string;
  }

  // Design Inspirations / Room Gallery
  const inspirationGallery: InspirationItem[] = [
    {
      title: 'The Golden Hour Lounge',
      room: 'living',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80',
      details: 'Double-height ceiling, floating brass fireplace, backlit onyx walls, and sand-hued bouclé fabrics.',
      designer: 'Michael Chen'
    },
    {
      title: 'Monochromatic Master Suite',
      room: 'bedroom',
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80',
      details: 'Plush charcoal velvet bed frame, smoked oak wood veneers, custom fluted headboard, and hidden cove lighting.',
      designer: 'Glory Simon'
    },
    {
      title: 'The Alabaster Kitchen',
      room: 'kitchen',
      image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&auto=format&fit=crop&q=80',
      details: 'Vein-matched Calacatta Gold island top, sandblasted wood cabinet handles, and integrated sub-zero panels.',
      designer: 'Glory Simon'
    },
    {
      title: 'The Executive Boardroom',
      room: 'office',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      details: 'Acoustic dark walnut panel cladding, custom 18-seat brass conference table, and dimmable halogen spots.',
      designer: 'Michael Chen'
    },
    {
      title: 'The Travertine Dining Room',
      room: 'dining',
      image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop&q=80',
      details: 'Raw edge honed travertine slab table, beige linen chairs, fluted plaster columns, and Murano chandelier.',
      designer: 'Elena Rostova'
    }
  ];

  // Filtering inspirations
  const filteredInspirations = useMemo(() => {
    if (selectedRoomCategory === 'all') return inspirationGallery;
    return inspirationGallery.filter(item => item.room === selectedRoomCategory);
  }, [selectedRoomCategory]);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    addToast('Palette Hex Copied', `${hex} has been stored to clipboard.`, 'success');
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden text-left">
      
      {/* Cinematic Hero Header */}
      <div className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-[#D4A65A]/15 bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&auto=format&fit=crop&q=90" 
            alt="Luxury material showroom" 
            className="w-full h-full object-cover brightness-[35%] filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0A0A0A]/40 to-[#0A0A0A]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-radial from-[#D4A65A]/5 to-transparent pointer-events-none filter blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-4">
          <span className="text-xxs tracking-[0.5em] text-[#E6C27A] uppercase font-bold block font-display">Atmospheric Studio</span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight">Creative Design Studio</h1>
          <p className="text-xs md:text-sm text-[#A9A9A9] max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Source materials, compile harmonious color palettes, and curate high-end room design collections.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
        
        {/* Room Category Filters */}
        <div className="flex overflow-x-auto gap-2 pb-3 journey-bar border-b border-[#D4A65A]/10 font-display text-[9px] tracking-wider uppercase font-bold">
          {roomCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedRoomCategory(cat.id)}
              className={`px-4.5 py-2 rounded-full cursor-pointer whitespace-nowrap transition-all duration-300 ${
                selectedRoomCategory === cat.id 
                  ? 'bg-[#D4A65A] text-black shadow-lg font-bold' 
                  : 'bg-[#141414] text-[#A9A9A9] hover:text-white border border-[#D4A65A]/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Materials and Color Palette Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Material Samples Grid */}
          <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A65A]/10 pb-4">
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-[#D4A65A]" /> Design Material Library
              </h3>
              
              <div className="flex bg-[#141414] border border-[#D4A65A]/15 rounded-full p-0.5 font-display text-[8.5px] tracking-widest uppercase font-bold">
                {[
                  { id: 'marble', label: 'Marble' },
                  { id: 'wood', label: 'Wood' },
                  { id: 'paint', label: 'Paint' },
                  { id: 'lighting', label: 'Lighting' },
                  { id: 'furniture', label: 'Furniture' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMaterialTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                      activeMaterialTab === tab.id 
                        ? 'bg-[#D4A65A] text-black font-semibold' 
                        : 'text-[#A9A9A9] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <GlassCard className="p-6 bg-[#141414]/30 shadow-soft-luxe border-[#D4A65A]/10 min-h-[260px] flex-grow">
              <AnimatePresence mode="wait">
                {activeMaterialTab === 'marble' && (
                  <motion.div
                    key="marble"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full"
                  >
                    {marbleCollection.map((m, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#D4A65A]/10 p-3 flex flex-col justify-between h-44 bg-[#1C1C1C]/50 relative overflow-hidden group shadow-sm hover:border-[#D4A65A]/35 transition-all duration-500">
                        <div 
                          className="h-20 w-full rounded-xl transition-transform duration-700 group-hover:scale-105 shadow-inner" 
                          style={{ background: m.textureBg }}
                        />
                        <div className="mt-2.5">
                          <span className="text-[8px] text-[#A9A9A9] uppercase font-mono block">Origin: {m.source}</span>
                          <span className="text-xs font-serif font-bold text-white mt-0.5 block">{m.name}</span>
                          <span className="text-[9px] text-[#D4A65A] block mt-1 font-mono">{m.price}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeMaterialTab === 'wood' && (
                  <motion.div
                    key="wood"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full"
                  >
                    {woodCollection.map((w, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#D4A65A]/10 p-3 flex flex-col justify-between h-44 bg-[#1C1C1C]/50 relative overflow-hidden group shadow-sm hover:border-[#D4A65A]/35 transition-all duration-500">
                        <div className={`h-20 w-full rounded-xl transition-transform duration-700 group-hover:scale-105 shadow-inner ${w.colorBg}`} />
                        <div className="mt-2.5">
                          <span className="text-[8px] text-[#A9A9A9] uppercase font-mono block">Finish: {w.finish}</span>
                          <span className="text-xs font-serif font-bold text-white mt-0.5 block">{w.name}</span>
                          <span className="text-[9px] text-[#D4A65A] block mt-1 font-mono">{w.price}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeMaterialTab === 'paint' && (
                  <motion.div
                    key="paint"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full"
                  >
                    {colorSystem.map((color, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => copyToClipboard(color.hex)}
                        className="rounded-2xl border border-[#D4A65A]/10 p-3 flex flex-col justify-between h-44 bg-[#1C1C1C]/50 cursor-pointer hover:border-[#D4A65A]/35 transition-all shadow-sm group"
                      >
                        <div className="h-20 w-full rounded-xl border border-white/5 shadow-sm" style={{ backgroundColor: color.hex }} />
                        <div className="mt-2.5 flex justify-between items-end">
                          <div>
                            <span className="text-[8px] text-[#A9A9A9] uppercase font-mono block">{color.desc}</span>
                            <span className="text-xs font-serif font-bold text-white mt-0.5 block">{color.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-[#D4A65A] group-hover:text-white transition-colors block">{color.hex}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeMaterialTab === 'lighting' && (
                  <motion.div
                    key="lighting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full"
                  >
                    {lightingCollection.map((l, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#D4A65A]/10 p-3 flex flex-col justify-between h-44 bg-[#1C1C1C]/50 relative overflow-hidden group shadow-sm hover:border-[#D4A65A]/35 transition-all duration-500">
                        <div className={`h-20 w-full rounded-xl transition-all duration-700 group-hover:scale-105 shadow-inner ${l.colorBg}`} />
                        <div className="mt-2.5">
                          <span className="text-[8px] text-[#A9A9A9] uppercase font-mono block">Lumen Spec: {l.type}</span>
                          <span className="text-xs font-serif font-bold text-white mt-0.5 block">{l.name}</span>
                          <span className="text-[9px] text-[#D4A65A] block mt-1 font-mono">{l.price}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeMaterialTab === 'furniture' && (
                  <motion.div
                    key="furniture"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full"
                  >
                    {furnitureCollection.map((f, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#D4A65A]/10 p-3 flex flex-col justify-between h-44 bg-[#1C1C1C]/50 relative overflow-hidden group shadow-sm hover:border-[#D4A65A]/35 transition-all duration-500">
                        <div className={`h-20 w-full rounded-xl transition-all duration-700 group-hover:scale-105 shadow-inner ${f.colorBg}`} />
                        <div className="mt-2.5">
                          <span className="text-[8px] text-[#A9A9A9] uppercase font-mono block">{f.desc}</span>
                          <span className="text-xs font-serif font-bold text-white mt-0.5 block">{f.name}</span>
                          <span className="text-[9px] text-[#D4A65A] block mt-1 font-mono">{f.price}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          {/* Color Palette Clipboard */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <GlassCard hoverEffect={false} className="p-6 bg-[#141414]/50 border-[#D4A65A]/15 shadow-soft-luxe h-full flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[#A9A9A9] tracking-wider uppercase font-mono border-b border-[#D4A65A]/10 pb-3 flex items-center gap-1.5">
                  <Palette className="h-4.5 w-4.5 text-[#D4A65A]" /> Color System Palette
                </h4>
                <p className="text-[10.5px] text-[#A9A9A9] mt-2.5 font-light leading-relaxed">
                  Click on paint swatches below to copy the HEX code to your layout dashboard clipboard.
                </p>
                
                <div className="space-y-3 mt-6">
                  {colorSystem.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => copyToClipboard(item.hex)}
                      className="flex justify-between items-center text-xs p-2.5 rounded-xl border border-[#D4A65A]/10 bg-[#1C1C1C]/40 hover:bg-[#1C1C1C]/80 cursor-pointer transition-colors group"
                    >
                      <span className="flex items-center gap-3 text-slate-300">
                        <span className="h-6 w-6 rounded-md border border-white/10 shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: item.hex }} />
                        <span className="font-semibold text-white block">{item.name}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#D4A65A] group-hover:text-white transition-colors flex items-center gap-1">
                        {copiedHex === item.hex ? <Check className="h-3 w-3 text-[#5D8A72]" /> : <Copy className="h-3 w-3" />}
                        {item.hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-[#D4A65A]/10 pt-4 mt-6">
                <span className="text-[8px] text-[#A9A9A9] uppercase font-mono block">Atmospheric signature</span>
                <p className="text-[10px] text-[#A9A9A9]/60 mt-1 font-light leading-relaxed">
                  Warm champagne metals framing rich terracotta woods and botanical emerald accents.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Room Inspirations Section */}
        <div className="space-y-6">
          <div className="border-b border-[#D4A65A]/15 pb-4 text-left">
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-[#C76B4F]" /> Room Design Collections
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredInspirations.map(concept => (
                <motion.div
                  key={concept.title}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                  className="group relative rounded-3xl bg-[#141414]/30 border border-[#D4A65A]/15 overflow-hidden shadow-soft-luxe flex flex-col justify-between h-[360px] cursor-pointer"
                >
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={concept.image} 
                      alt={concept.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[2.5s] ease-out brightness-[45%] group-hover:brightness-[55%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  </div>
                  
                  <div className="relative z-10 p-6 flex flex-col justify-between h-full text-left">
                    <span className="px-3.5 py-1.5 rounded-full bg-[#0A0A0A]/70 backdrop-blur-md border border-[#D4A65A]/25 text-[8px] font-semibold text-[#E6C27A] uppercase tracking-wider font-display shadow-lg w-fit">
                      {concept.room} space
                    </span>
                    
                    <div className="space-y-2 mt-auto">
                      <span className="text-[9px] text-[#D4A65A] font-mono tracking-widest uppercase block">Designer: {concept.designer}</span>
                      <h4 className="text-lg font-serif font-bold text-white tracking-wide">{concept.title}</h4>
                      <p className="text-[11px] text-[#A9A9A9] leading-relaxed font-light border-t border-[#D4A65A]/10 pt-2 mt-2">
                        {concept.details}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignStudioPage;

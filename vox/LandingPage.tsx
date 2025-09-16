import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Play, 
  Star, 
  Sparkles, 
  Zap, 
  Globe, 
  Film, 
  Gamepad2, 
  Heart,
  ArrowRight,
  Volume2,
  Eye,
  Wand2,
  Rocket,
  CheckCircle
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface LandingPageProps {
  onTryApp: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onTryApp }) => {
  const { theme } = useTheme()

  return (
    <div className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'} min-h-screen`}>

      {/* Hero Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-purple-500/10 to-blue-500/10"></div>
        <div className="max-w-7xl mx-auto px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3" data-aos="fade-right" data-aos-delay="200">
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-900 via-red-600 to-purple-600 dark:from-white dark:via-red-400 dark:to-purple-400 bg-clip-text text-transparent">
                Your Voice.<br />
                <span className="text-red-500">Instant Magic.</span>
              </h1>
              <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6 leading-relaxed`}>
                REVOLUTIONARY STORYTELLING Vox-App transforms your words into cinematic masterpieces in real-time.
                
              </p>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Voice-Activated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Real-Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Cinematic</span>
                </div>
              </div>
              <Button 
                onClick={onTryApp}
                className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg mb-6 group transition-all duration-300 transform hover:scale-105"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch App
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span>4.9 (2500+)</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Always free trial - No credit card</span>
              </div>
            </div>
            <div className="lg:col-span-2 flex justify-center" data-aos="fade-left" data-aos-delay="400">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative w-96 h-96 bg-black rounded-3xl shadow-2xl overflow-hidden">
                  <video 
                    src="https://res.cloudinary.com/dgbreoalg/video/upload/v1757248969/Daydream_-_Reaction_Diffusion_Cotton_Candy______Made_by_as_ws_Upscaled_and_de..._W6Jq9N_qlid0s.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-black ml-1" />
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-yellow-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section id="features" className={`py-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-red-500/5"></div>
        <div className="max-w-7xl mx-auto px-8 relative">
          <div className="text-center mb-16" data-aos="fade-up">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
                Why This Matters
              </h2>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-4xl mx-auto`}>
              Storytelling has always been <span className="line-through text-gray-400">flat</span> — text, video, slides.<br />
              <span className="font-bold text-red-500">We're breaking the wall:</span> your emotions + your words = <span className="font-bold text-purple-500">living stories</span>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group" data-aos="fade-up" data-aos-delay="200">
              <div className="mb-6 relative">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Volume2 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5 text-red-500" />
                Tone-Aware Magic
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                <span className="font-semibold text-red-500">Shout "dragon!"</span> → firestorm rages.<br />
                <span className="font-semibold text-blue-500">Whisper "friendship"</span> → colors soften.
              </p>
            </div>
            
            <div className="text-center group" data-aos="fade-up" data-aos-delay="400">
              <div className="mb-6 relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-800" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Lightning Fast
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                <span className="font-semibold text-blue-500">Zero waiting.</span> Zero edits.<br />
                Your story builds <span className="font-bold text-purple-500">as fast as you speak</span>.
              </p>
            </div>
            
            <div className="text-center group" data-aos="fade-up" data-aos-delay="600">
              <div className="mb-6 relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-purple-800" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 flex items-center justify-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Infinite Worlds
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                <span className="font-semibold text-green-500">Bedtime fairytales</span> to<br />
                <span className="font-semibold text-purple-500">meme-chaos</span> with friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* See It In Action Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-red-500/5"></div>
        <div className="max-w-7xl mx-auto px-8 relative">
          <div className="text-center mb-16" data-aos="zoom-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Wand2 className="w-8 h-8 text-purple-500" />
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                See The Magic Live
              </h2>
              <Wand2 className="w-8 h-8 text-purple-500" />
            </div>
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-4xl mx-auto`}>
              <span className="font-bold text-purple-500">Every demo feels different.</span> Every voice builds a new world.<br />
              <span className="text-lg font-semibold text-red-500">You don't watch the story — you become it.</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl group hover:shadow-2xl transition-all duration-300" data-aos="fade-up" data-aos-delay="200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                <span className="text-pink-500">"Once upon a time…"</span>
              </h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                  A castle blooms from mist
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Child's voice creates magic</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl group hover:shadow-2xl transition-all duration-300" data-aos="fade-up" data-aos-delay="400">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Film className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                <span className="text-purple-500">"Dark forest"</span>
              </h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                  Shadows twist, torches flicker
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Creator's whisper sets mood</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl group hover:shadow-2xl transition-all duration-300" data-aos="fade-up" data-aos-delay="600">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                <span className="text-orange-500">"Banana army!"</span>
              </h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                  Yellow peel soldiers charge
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Friend's energy creates chaos</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              onClick={onTryApp}
              className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg mb-6 group transition-all duration-300 transform hover:scale-105"
              data-aos="zoom-in" data-aos-delay="800"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Launch App
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>4.9 (2500+)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why We'll Win Section */}
      <section id="reviews" className={`py-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">🚀 Why We'll Win</h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              This isn't just an app. It's a new medium.<br />
              Voice → Emotion → Story → Scene.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />,
                title: "Unique & first-of-its-kind",
                description: "No plugin, no clone, no gimmick."
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />,
                title: "Instant emotional payoff",
                description: "Laughter, awe, surprise, all in seconds."
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />,
                title: "Versatility shown live",
                description: "Kids, creators, gamers, educators. One engine, infinite modes."
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />,
                title: "Future-proof vision",
                description: "Today: story scenes. Tomorrow: movies, classrooms, games."
              }
            ].map((feature, index) => (
              <Card key={index} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="font-semibold text-red-500 mb-2">{feature.title}</h4>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Next Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">🔮 What's Next </h2>
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              The future of storytelling is here. Today: story scenes. Tomorrow: everything.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "🎧",
                title: "Kids Mode",
                description: "Bedtime magic on demand."
              },
              {
                icon: "📚",
                title: "Classroom Mode",
                description: "History & science, visualized."
              },
              {
                icon: "🎬",
                title: "Creator Mode",
                description: "Indie filmmakers & writers storyboard instantly."
              },
              {
                icon: "🤝",
                title: "Party Mode",
                description: "Multiplayer storytelling chaos (Skribbl.io vibes)."
              }
            ].map((mode, index) => (
              <Card key={index} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:border-red-500 transition-colors`}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{mode.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{mode.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">🌟 Call to Action</h2>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            This isn't an app. It's a new medium.<br />
            Voice → Emotion → Story → Scene.
          </p>
          <Button 
            onClick={onTryApp}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold rounded-lg mb-6"
          >
            👉 Launch App
          </Button>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>4.9 (2500+)</span>
          </div>
          
          <div className="mt-12 flex justify-center gap-4 overflow-x-auto">
            {[
              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&h=300&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=150&h=300&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=150&h=300&fit=crop&auto=format",
              "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=300&fit=crop&auto=format"
            ].map((src, index) => (
              <img 
                key={index}
                src={src}
                alt={`Phone mockup ${index + 1}`}
                className="w-32 h-auto rounded-2xl shadow-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

export default LandingPage

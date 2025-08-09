import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import StartupsPage from "./pages/StartupsPage";
import StartupDetailPage from "./pages/StartupDetailPage";
import ComunidadesPage from "./pages/ComunidadesPage";
import CommunityDetailPage from "./pages/CommunityDetailPage";
import BlogPage from "./pages/BlogPage";
import EventosPage from "./pages/EventosPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStartups from "./pages/admin/AdminStartups";
import AdminStartupForm from "./pages/admin/AdminStartupForm";
import AdminCommunities from "./pages/admin/AdminCommunities";
import AdminCommunityForm from "./pages/admin/AdminCommunityForm";
import AdminBlogForm from "./pages/admin/AdminBlogForm";
import AdminEventForm from "./pages/admin/AdminEventForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes with layout */}
          <Route path="/" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <HomePage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/startups" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <StartupsPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/startups/:id" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <StartupDetailPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/comunidades" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <ComunidadesPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/comunidades/:id" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <CommunityDetailPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/blog" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <BlogPage />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/eventos" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <EventosPage />
              </main>
              <Footer />
            </div>
          } />
          
          {/* Admin routes without public layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="startups" element={<AdminStartups />} />
            <Route path="startups/new" element={<AdminStartupForm />} />
            <Route path="comunidades" element={<AdminCommunities />} />
            <Route path="comunidades/new" element={<AdminCommunityForm />} />
            <Route path="blog" element={<div className="p-6">Blog Management (Coming Soon)</div>} />
            <Route path="blog/new" element={<AdminBlogForm />} />
            <Route path="eventos" element={<div className="p-6">Events Management (Coming Soon)</div>} />
            <Route path="eventos/new" element={<AdminEventForm />} />
            <Route path="settings" element={<div className="p-6">Settings (Coming Soon)</div>} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockEvents } from "@/data/mockData";

const EventosPage = () => {
  const upcomingEvents = mockEvents.filter(event => event.isUpcoming);
  const pastEvents = mockEvents.filter(event => !event.isUpcoming);

  const EventCard = ({ event, index }: { event: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 * index }}
    >
      <Card className="bg-card hover:shadow-elegant transition-all duration-300 border-border hover:border-primary/30">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge 
              variant={event.isUpcoming ? "default" : "secondary"}
              className={event.isUpcoming ? "bg-primary text-primary-foreground" : ""}
            >
              {event.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {event.isUpcoming ? "Próximo" : "Finalizado"}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {event.description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {new Date(event.date).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              {event.time}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {event.location}
            </div>
          </div>

          {event.isUpcoming && (
            <div className="pt-4">
              <Button className="w-full bg-gradient-primary text-primary-foreground hover:shadow-neon">
                Registrarse
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Eventos <span className="text-gradient">DeFi México</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Únete a nuestra vibrante comunidad en eventos, workshops y meetups. 
            Aprende de expertos, conecta con otros desarrolladores y mantente 
            al día con las últimas tendencias DeFi.
          </p>
        </motion.div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 ? (
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2 h-8 bg-gradient-primary rounded-full" />
                <h2 className="text-3xl font-bold text-foreground">Próximos Eventos</h2>
              </div>
              <p className="text-muted-foreground">
                No te pierdas estos increíbles eventos que vienen
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay eventos próximos
              </h3>
              <p className="text-muted-foreground mb-4">
                Mantente atento a nuestras redes sociales para conocer los próximos eventos.
              </p>
            </motion.div>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2 h-8 bg-muted rounded-full" />
                <h2 className="text-3xl font-bold text-foreground">Eventos Pasados</h2>
              </div>
              <p className="text-muted-foreground">
                Revisa los eventos que hemos organizado anteriormente
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-dark p-8 rounded-2xl border border-border">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-4">
              ¿Quieres organizar un evento?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Si tienes una idea para un evento, workshop o meetup relacionado con DeFi, 
              nos encantaría colaborar contigo para hacerlo realidad.
            </p>
            <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:shadow-neon">
              Proponer Evento
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default EventosPage;
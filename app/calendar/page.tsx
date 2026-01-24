"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";
import { enUS } from "date-fns/locale";
import "./calendar.scss"; // SASS overrides including react-big-calendar styles
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

import { CreateEventDialog } from "./create-event-dialog";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  categoryId?: string;
  recurrence?: string;
  originalId?: string; // If it's an expanded instance
  isCompleted?: boolean;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const queryClient = useQueryClient();

  // Fetching events from the database
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["calendar-events", view, date],
    queryFn: async () => {
      let start, end;
      if (view === Views.MONTH) {
        start = startOfWeek(startOfMonth(date));
        end = endOfWeek(endOfMonth(date));
      } else if (view === Views.WEEK) {
        start = startOfWeek(date);
        end = endOfWeek(date);
      } else if (view === Views.DAY) {
        start = startOfDay(date);
        end = endOfDay(date);
      } else {
        // Default to Month for agenda or other views
        // start = new Date(); // This was causing issues by excluding earlier events today
        start = startOfDay(date);
        end = addDays(start, 30);
      }

      const response = await axios.get("/api/calendar", {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      return response.data;
    },
  });

  //   mutation for creating a event
  const { mutate: createEvent } = useMutation({
    mutationFn: async (event: any) => {
      const response = await axios.post("/api/calendar", event);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event created successfully");
    },
    onError: (error) => {
      console.error("Create event error:", error);
      toast.error("Failed to create event");
    },
  });

  //   mutation for updating a event
  const { mutate: updateEvent } = useMutation({
    mutationFn: async (event: any) => {
      const response = await axios.put("/api/calendar", event);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event updated successfully");
    },
    onError: (error) => {
      console.error("Update event error:", error);
      toast.error("Failed to update event");
    },
  });

  //   mutation for deleting a event
  const { mutate: deleteEvent } = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete("/api/calendar", { data: { id } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      console.error("Delete event error:", error);
      toast.error("Failed to delete event");
    },
  });

  useEffect(() => {
    if (eventsData) {
      const parsedEvents = eventsData.map((ev: any) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
      setEvents(parsedEvents);
    }
  }, [eventsData]);
  //   useCallback prevents the function from being recreated on every render
  const onNavigate = useCallback(
    (newDate: Date) => setDate(newDate),
    [setDate],
  );
  const onView = useCallback((newView: any) => setView(newView), [setView]);

  const onEventResize = useCallback(
    ({ event, start, end }: any) => {
      // Optimistic update
      setEvents((prev) => {
        const existing = prev.find((ev) => ev.id === event.id);
        if (!existing) return prev;
        const filtered = prev.filter((ev) => ev.id !== event.id);
        return [...filtered, { ...existing, start, end }] as any;
      });

      const targetId = event.originalId || event.id;
      updateEvent({ ...event, id: targetId, startTime: start, endTime: end });
    },
    [updateEvent],
  );

  const onEventDrop = useCallback(
    ({ event, start, end, isAllDay }: any) => {
      // Optimistic update
      setEvents((prev) => {
        const existing = prev.find((ev) => ev.id === event.id);
        if (!existing) return prev;
        const filtered = prev.filter((ev) => ev.id !== event.id);
        return [
          ...filtered,
          { ...existing, start, end, allDay: isAllDay },
        ] as any;
      });

      const targetId = event.originalId || event.id;
      updateEvent({
        ...event,
        id: targetId,
        startTime: start,
        endTime: end,
        allDay: isAllDay,
      });
    },
    [updateEvent],
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setSelectedSlot({ start, end });
      setSelectedEvent(null);
      setIsDialogOpen(true);
    },
    [],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setIsDialogOpen(true);
  }, []);

  const handleSaveEvent = (eventData: any) => {
    if (selectedEvent) {
      const idToUpdate = selectedEvent.originalId || selectedEvent.id;
      updateEvent({ ...eventData, id: idToUpdate });
    } else {
      createEvent({
        ...eventData,
        startTime: selectedSlot?.start || eventData.startTime, // Fallback
        endTime: selectedSlot?.end || eventData.endTime,
      });
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      const idToDelete = selectedEvent.originalId || selectedEvent.id;
      deleteEvent(idToDelete);
      setIsDialogOpen(false);
    }
  };

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const style: any = {};

      if (view === "agenda") {
        style.borderLeft = `4px solid ${event.color || "#3b82f6"}`;
        style.backgroundColor = "transparent"; // Keep date cell clean
      } else {
        style.backgroundColor = event.color || "#3b82f6";
      }

      if (event.isCompleted) {
        style.opacity = 0.5;
        style.textDecoration = "line-through";
      }
      return {
        style,
      };
    },
    [view],
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Calendar</h1>
      <div className="h-[calc(100vh-120px)] border border-white/10 rounded-xl overflow-hidden bg-zinc-950/50 p-4">
        <DnDCalendar
          view={view}
          date={date}
          onNavigate={onNavigate}
          onView={onView}
          defaultView={Views.WEEK}
          events={events}
          localizer={localizer}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventPropGetter}
          resizable
          selectable
          style={{ height: "100%" }}
          views={["month", "week", "day", "agenda"]}
          className="text-white"
          step={60}
          timeslots={1}
        />
      </div>

      <CreateEventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedSlot?.start}
        initialEvent={selectedEvent}
      />
    </div>
  );
}

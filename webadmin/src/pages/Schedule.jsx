import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';

export default function Schedule() {
  // Dummy data for today's timetable
  const todaysSchedule = [
    {
      id: 1,
      subject: "Mathematics",
      class: "Class 8-A",
      startTime: "08:00 AM",
      endTime: "09:00 AM",
      room: "Room 101",
      type: "Lecture",
      status: "completed"
    },
    {
      id: 2,
      subject: "Physics",
      class: "Class 9-B",
      startTime: "09:15 AM",
      endTime: "10:15 AM",
      room: "Lab 3",
      type: "Practical",
      status: "ongoing"
    },
    {
      id: 3,
      subject: "Free Period",
      class: "-",
      startTime: "10:15 AM",
      endTime: "11:00 AM",
      room: "Staff Room",
      type: "Break",
      status: "upcoming"
    },
    {
      id: 4,
      subject: "Mathematics",
      class: "Class 10-A",
      startTime: "11:00 AM",
      endTime: "12:00 PM",
      room: "Room 205",
      type: "Lecture",
      status: "upcoming"
    },
    {
      id: 5,
      subject: "Computer Science",
      class: "Class 8-B",
      startTime: "12:30 PM",
      endTime: "01:30 PM",
      room: "Computer Lab",
      type: "Lab",
      status: "upcoming"
    }
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col w-full pb-10">
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">Today's Schedule</h2>
        <p className="text-on-surface-variant flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          {today}
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
        <div className="space-y-6">
          {todaysSchedule.map((session, index) => (
            <div key={session.id} className="relative flex gap-6">
              {/* Timeline line */}
              {index !== todaysSchedule.length - 1 && (
                <div className="absolute top-10 left-[4.5rem] bottom-[-24px] w-0.5 bg-outline-variant/30"></div>
              )}
              
              {/* Time Column */}
              <div className="flex flex-col items-center w-24 shrink-0 pt-2 relative z-10">
                <span className="text-sm font-bold text-on-surface">{session.startTime.split(' ')[0]}</span>
                <span className="text-xs text-on-surface-variant font-medium">{session.startTime.split(' ')[1]}</span>
                <div className={`mt-2 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-surface-container-lowest
                  ${session.status === 'completed' ? 'bg-surface-container-highest text-on-surface-variant' : 
                    session.status === 'ongoing' ? 'bg-primary text-on-primary shadow-md shadow-primary/30 ring-2 ring-primary/20 ring-offset-2' : 
                    'bg-secondary-container text-on-secondary-container'}`}>
                  {session.type === 'Break' ? (
                    <span className="material-symbols-outlined text-[20px]">coffee</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  )}
                </div>
              </div>

              {/* Content Card */}
              <div className={`flex-1 rounded-xl p-5 border transition-all hover:shadow-md
                ${session.status === 'ongoing' ? 'bg-primary-fixed border-primary/30 shadow-sm' : 
                  session.type === 'Break' ? 'bg-surface border-dashed border-outline-variant opacity-70' : 
                  'bg-surface-container-lowest border-outline-variant hover:border-outline'}`}>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className={`text-lg font-bold ${session.status === 'ongoing' ? 'text-on-primary-fixed' : 'text-on-surface'}`}>
                      {session.subject}
                    </h3>
                    {session.class !== '-' && (
                      <span className={`inline-flex items-center gap-1 text-sm font-medium mt-1
                        ${session.status === 'ongoing' ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'}`}>
                        <Users className="w-4 h-4" />
                        {session.class}
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${session.status === 'ongoing' ? 'bg-primary text-on-primary animate-pulse' : 
                      session.status === 'completed' ? 'bg-surface-variant text-on-surface-variant' : 
                      'bg-secondary-fixed text-on-secondary-fixed-variant'}`}>
                    {session.status}
                  </span>
                </div>

                <div className={`flex items-center gap-6 mt-4 text-sm font-medium
                  ${session.status === 'ongoing' ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'}`}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {session.startTime} - {session.endTime}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {session.room}
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className={`px-2 py-0.5 rounded text-xs border font-semibold
                      ${session.status === 'ongoing' ? 'border-primary/20 bg-primary/10' : 'border-outline-variant bg-surface'}`}>
                      {session.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

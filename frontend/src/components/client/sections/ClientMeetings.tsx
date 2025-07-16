import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus, Video, MapPin } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'video' | 'in-person' | 'phone';
  accountant: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
}

export const ClientMeetings: React.FC = () => {
  const [meetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Monthly Financial Review',
      date: '2024-02-15',
      time: '10:00 AM',
      type: 'video',
      accountant: 'Sarah Johnson',
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Tax Planning Session',
      date: '2024-02-20',
      time: '2:00 PM',
      type: 'in-person',
      accountant: 'Sarah Johnson',
      status: 'scheduled',
      location: 'SwiftBooks Office, Suite 200'
    },
    {
      id: '3',
      title: 'Q4 Report Discussion',
      date: '2024-01-30',
      time: '11:00 AM',
      type: 'video',
      accountant: 'Sarah Johnson',
      status: 'completed'
    }
  ]);

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const pastMeetings = meetings.filter(m => m.status === 'completed');

  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'in-person':
        return <MapPin className="h-5 w-5 text-green-600" />;
      case 'phone':
        return <User className="h-5 w-5 text-purple-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Meeting Management</h2>
              <p className="text-gray-600">Schedule and manage meetings with your accountants</p>
            </div>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Quick Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule New Meeting</CardTitle>
          <CardDescription>
            Book a meeting with your assigned accountant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Video className="h-6 w-6 mb-2 text-blue-600" />
              <span>Video Call</span>
              <span className="text-xs text-gray-500">30-60 minutes</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <MapPin className="h-6 w-6 mb-2 text-green-600" />
              <span>In-Person</span>
              <span className="text-xs text-gray-500">45-90 minutes</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <User className="h-6 w-6 mb-2 text-purple-600" />
              <span>Phone Call</span>
              <span className="text-xs text-gray-500">15-30 minutes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
          <CardDescription>
            Your scheduled meetings with accountants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming meetings scheduled</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Meeting
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getMeetingIcon(meeting.type)}
                      <div>
                        <p className="font-medium text-gray-900">{meeting.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(meeting.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {meeting.time}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {meeting.accountant}
                          </span>
                        </div>
                        {meeting.location && (
                          <p className="text-sm text-gray-500 mt-1">
                            📍 {meeting.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                      <Button variant="outline" size="sm">
                        Join
                      </Button>
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting History</CardTitle>
          <CardDescription>
            Your completed meetings and notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No meeting history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastMeetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getMeetingIcon(meeting.type)}
                      <div>
                        <p className="font-medium text-gray-900">{meeting.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(meeting.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {meeting.accountant}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                      <Button variant="outline" size="sm">
                        View Notes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            <p className="text-amber-800 font-medium">Development Notice</p>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Meeting scheduling will be integrated with Google Calendar API for real-time availability and booking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 
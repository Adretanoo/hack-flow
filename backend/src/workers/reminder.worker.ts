/**
 * Background worker — polls Redis every 60 s for due mentor-slot reminders.
 *
 * Architecture:
 *  - popDueReminders() atomically fetches and removes all jobs with score ≤ now
 *  - For each job: verify slot is still 'booked', fetch team members + mentor, send emails
 *  - Errors per-job are caught individually so one failure doesn't abort the batch
 *  - NOT started in test environment (NODE_ENV === 'test') to prevent setInterval leaks
 */
import { popDueReminders } from '../services/reminder.service';
import { sendMentorReminderEmail } from '../services/email.service';
import { getDatabaseConnection } from '../config/database';
import {
  mentorSlots,
  mentorAvailabilities,
  teamMembers,
  users,
  teams,
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const POLL_INTERVAL_MS = 60_000;

async function tick(): Promise<void> {
  let jobs;
  try {
    jobs = await popDueReminders();
  } catch (err) {
    console.error('[reminder-worker] Failed to pop due reminders from Redis:', err);
    return;
  }

  if (jobs.length === 0) return;

  const db = getDatabaseConnection();

  for (const job of jobs) {
    try {
      // 1. Verify slot is still booked (may have been cancelled after scheduling)
      const [slot] = await db
        .select()
        .from(mentorSlots)
        .where(eq(mentorSlots.id, job.slotId))
        .limit(1);

      if (!slot || slot.status !== 'booked') {
        console.info(`[reminder-worker] Skipping slot ${job.slotId} — status: ${slot?.status ?? 'not found'}`);
        continue;
      }

      // 2. Resolve mentor name via mentor_availabilities → users
      const [availability] = await db
        .select({ mentorId: mentorAvailabilities.mentorId })
        .from(mentorAvailabilities)
        .where(eq(mentorAvailabilities.id, slot.mentorAvailabilityId))
        .limit(1);

      const mentorId = availability?.mentorId ?? job.mentorId;
      const [mentorUser] = await db
        .select({ fullName: users.fullName, email: users.email })
        .from(users)
        .where(eq(users.id, mentorId))
        .limit(1);

      const mentorName = mentorUser?.fullName ?? 'Mentor';

      // 3. Resolve team name
      const [team] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, job.teamId))
        .limit(1);

      const teamName = team?.name ?? 'Team';

      // 4. Fetch team members' emails
      const members = await db
        .select({ email: users.email })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, job.teamId));

      // 5. Send reminder to each member (fire-and-forget)
      for (const member of members) {
        if (member.email) {
          void sendMentorReminderEmail({
            to: member.email,
            mentorName,
            teamName,
            startTime: new Date(job.startTime),
            meetingLink: job.meetingLink,
          });
        }
      }

      console.info(`[reminder-worker] Sent reminder for slot ${job.slotId} to ${members.length} member(s)`);
    } catch (err) {
      // Isolate per-job failures — other jobs still process
      console.error(`[reminder-worker] Error processing slot ${job.slotId}:`, err);
    }
  }
}

export function startReminderWorker(): void {
  // Run immediately to catch any reminders missed during downtime
  void tick();
  setInterval(() => void tick(), POLL_INTERVAL_MS);
  console.info('[reminder-worker] Started — polling every 60 s');
}

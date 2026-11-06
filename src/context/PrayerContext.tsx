import React, { createContext, useContext, useState, useEffect } from 'react';
import { DailyPrayerSchedule, PrayerTimeItem } from '../types';
import { SolarPrayerCalculator } from '../services/solarCalculator';
import { WebAudioService } from '../services/audioService';

interface PrayerContextType {
  currentSchedule: DailyPrayerSchedule;
  currentTimeStr: string;
  currentDateStr: string;
  hijriDateStr: string;
  nextPrayer: PrayerTimeItem | null;
  countdownStr: string;
  isHanafi: boolean;
  setIsHanafi: (val: boolean) => void;
  latitude: number;
  longitude: number;
  updateCoordinates: (lat: number, lng: number) => void;
  saveManualOverride: (prayerName: string, newAdhan: string, newJamaat: string) => void;
  toggleAlarm: (prayerName: string) => void;
  jamaatLeadMinutes: number;
  setJamaatLeadMinutes: (mins: number) => void;
  getWeeklySchedules: () => DailyPrayerSchedule[];
  getMonthlySchedules: () => DailyPrayerSchedule[];
}

const PrayerContext = createContext<PrayerContextType>({} as any);

export const PrayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latitude, setLatitude] = useState<number>(19.9248);
  const [longitude, setLongitude] = useState<number>(75.3670);
  const [isHanafi, setIsHanafi] = useState<boolean>(true);
  const [jamaatLeadMinutes, setJamaatLeadMinutes] = useState<number>(15);

  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [hijriDateStr, setHijriDateStr] = useState<string>('');
  const [countdownStr, setCountdownStr] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeItem | null>(null);

  // Manual overrides map keyed by "YYYY-MM-DD"
  const [manualOverrides, setManualOverrides] = useState<Record<string, Record<string, { adhan: string; jamaat: string }>>>(() => {
    const saved = localStorage.getItem('masjid_prayer_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Alarm toggles map
  const [alarmToggles, setAlarmToggles] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('masjid_alarm_toggles');
    return saved ? JSON.parse(saved) : { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
  });

  useEffect(() => {
    localStorage.setItem('masjid_prayer_overrides', JSON.stringify(manualOverrides));
  }, [manualOverrides]);

  useEffect(() => {
    localStorage.setItem('masjid_alarm_toggles', JSON.stringify(alarmToggles));
  }, [alarmToggles]);

  const generateScheduleForDate = (date: Date): DailyPrayerSchedule => {
    const dateKey = date.toISOString().split('T')[0];
    const calculated = SolarPrayerCalculator.calculate(date, latitude, longitude, 5.5, isHanafi);
    const dayOverrides = manualOverrides[dateKey] || {};

    // Approved default official Jamaat schedule for Sawangi
    const prayers: PrayerTimeItem[] = [
      {
        name: 'Fajr',
        arabicName: 'الفجر',
        calculatedTime: calculated.fajr,
        officialAdhanTime: dayOverrides['Fajr']?.adhan || '05:25 AM',
        jamaatTime: dayOverrides['Fajr']?.jamaat || '05:50 AM',
        isAlarmEnabled: alarmToggles['Fajr'] !== false,
      },
      {
        name: 'Dhuhr',
        arabicName: 'الظهر',
        calculatedTime: calculated.dhuhr,
        officialAdhanTime: dayOverrides['Dhuhr']?.adhan || '12:30 PM',
        jamaatTime: dayOverrides['Dhuhr']?.jamaat || '01:15 PM',
        isAlarmEnabled: alarmToggles['Dhuhr'] !== false,
      },
      {
        name: 'Asr',
        arabicName: 'العصر',
        calculatedTime: calculated.asr,
        officialAdhanTime: dayOverrides['Asr']?.adhan || '04:35 PM',
        jamaatTime: dayOverrides['Asr']?.jamaat || '04:50 PM',
        isAlarmEnabled: alarmToggles['Asr'] !== false,
      },
      {
        name: 'Maghrib',
        arabicName: 'المغرب',
        calculatedTime: calculated.maghrib,
        officialAdhanTime: dayOverrides['Maghrib']?.adhan || calculated.maghrib,
        jamaatTime: dayOverrides['Maghrib']?.jamaat || '06:00 PM',
        isAlarmEnabled: alarmToggles['Maghrib'] !== false,
      },
      {
        name: 'Isha',
        arabicName: 'العشاء',
        calculatedTime: calculated.isha,
        officialAdhanTime: dayOverrides['Isha']?.adhan || '08:15 PM',
        jamaatTime: dayOverrides['Isha']?.jamaat || '08:30 PM',
        isAlarmEnabled: alarmToggles['Isha'] !== false,
      },
    ];

    return {
      dateKey,
      hijriDate: SolarPrayerCalculator.getHijriDate(date),
      prayers,
      sunriseTime: calculated.sunrise,
      jumuahBayanTime: '01:00 PM',
      jumuahKhutbahTime: '01:30 PM',
      jumuahJamaatTime: '01:45 PM',
      isOverridden: Object.keys(dayOverrides).length > 0,
    };
  };

  const [currentSchedule, setCurrentSchedule] = useState<DailyPrayerSchedule>(() => generateScheduleForDate(new Date()));

  // Live clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in 12h
      let h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      setCurrentTimeStr(`${pad(h)}:${pad(m)}:${pad(s)} ${period}`);

      // Format date in English
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDateStr(now.toLocaleDateString('en-IN', options));
      setHijriDateStr(SolarPrayerCalculator.getHijriDate(now));

      // Re-evaluate schedule
      const sched = generateScheduleForDate(now);
      setCurrentSchedule(sched);

      // Determine next prayer and countdown
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      let next: PrayerTimeItem | null = null;
      let diffMinutes = 999999;

      for (const p of sched.prayers) {
        const [timePart, meridiem] = p.officialAdhanTime.split(' ');
        let [ph, pm] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && ph !== 12) ph += 12;
        if (meridiem === 'AM' && ph === 12) ph = 0;
        const pTotalMins = ph * 60 + pm;

        if (pTotalMins > nowMinutes) {
          next = p;
          diffMinutes = pTotalMins - nowMinutes;
          break;
        }
      }

      // If all passed today, next is tomorrow's Fajr
      if (!next && sched.prayers.length > 0) {
        next = sched.prayers[0];
        const [timePart, meridiem] = next.officialAdhanTime.split(' ');
        let [ph, pm] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && ph !== 12) ph += 12;
        if (meridiem === 'AM' && ph === 12) ph = 0;
        const fajrMins = ph * 60 + pm;
        diffMinutes = 1440 - nowMinutes + fajrMins;
      }

      if (next) {
        setNextPrayer(next);
        const hrs = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setCountdownStr(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [latitude, longitude, isHanafi, manualOverrides, alarmToggles]);

  const saveManualOverride = (prayerName: string, newAdhan: string, newJamaat: string) => {
    const todayKey = new Date().toISOString().split('T')[0];
    setManualOverrides((prev) => ({
      ...prev,
      [todayKey]: {
        ...(prev[todayKey] || {}),
        [prayerName]: { adhan: newAdhan, jamaat: newJamaat },
      },
    }));
  };

  const toggleAlarm = (prayerName: string) => {
    setAlarmToggles((prev) => ({
      ...prev,
      [prayerName]: !prev[prayerName],
    }));
  };

  const updateCoordinates = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const getWeeklySchedules = (): DailyPrayerSchedule[] => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() + i * 86400000);
      return generateScheduleForDate(d);
    });
  };

  const getMonthlySchedules = (): DailyPrayerSchedule[] => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() + i * 86400000);
      return generateScheduleForDate(d);
    });
  };

  return (
    <PrayerContext.Provider
      value={{
        currentSchedule,
        currentTimeStr,
        currentDateStr,
        hijriDateStr,
        nextPrayer,
        countdownStr,
        isHanafi,
        setIsHanafi,
        latitude,
        longitude,
        updateCoordinates,
        saveManualOverride,
        toggleAlarm,
        jamaatLeadMinutes,
        setJamaatLeadMinutes,
        getWeeklySchedules,
        getMonthlySchedules,
      }}
    >
      {children}
    </PrayerContext.Provider>
  );
};

export const usePrayer = () => useContext(PrayerContext);

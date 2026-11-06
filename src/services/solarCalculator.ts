// Astronomical solar calculation engine for Masjid Mehmoodiya - Sawangi
// Latitude: 19.9248° N, Longitude: 75.3670° E, Timezone: Asia/Kolkata (+05:30)

export interface SolarTimings {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export class SolarPrayerCalculator {
  static calculate(
    date: Date = new Date(),
    latitude: number = 19.9248,
    longitude: number = 75.3670,
    timezoneHours: number = 5.5,
    isHanafi: boolean = true,
    fajrAngle: number = 18.0,
    ishaAngle: number = 18.0
  ): SolarTimings {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 1. Julian Date
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
    const d = jd - 2451545.0;

    // 2. Solar coordinates
    const meanAnomaly = this.fixAngle(357.529 + 0.98560028 * d);
    const meanLongitude = this.fixAngle(280.459 + 0.98564736 * d);
    const eclipticLongitude = this.fixAngle(
      meanLongitude +
        1.915 * Math.sin(this.degToRad(meanAnomaly)) +
        0.02 * Math.sin(this.degToRad(2 * meanAnomaly))
    );
    const obliquity = 23.439 - 0.00000036 * d;

    // Declination (delta)
    const sinDeclination = Math.sin(this.degToRad(obliquity)) * Math.sin(this.degToRad(eclipticLongitude));
    const declination = this.radToDeg(Math.asin(sinDeclination));

    // Equation of Time (EoT) in minutes
    const rightAscension =
      this.radToDeg(
        Math.atan2(
          Math.cos(this.degToRad(obliquity)) * Math.sin(this.degToRad(eclipticLongitude)),
          Math.cos(this.degToRad(eclipticLongitude))
        )
      ) / 15.0;
    const equationOfTime = (meanLongitude / 15.0 - this.fixHour(rightAscension)) * 60.0;

    // 3. Solar Transit (Dhuhr)
    const transit = 12.0 + timezoneHours - longitude / 15.0 - equationOfTime / 60.0;

    // 4. Sun Angle Calculations
    const sunriseHourAngle = this.calculateHourAngle(0.833, latitude, declination);
    const sunrise = transit - sunriseHourAngle;
    const sunset = transit + sunriseHourAngle;

    const fajrHourAngle = this.calculateHourAngle(fajrAngle, latitude, declination);
    const fajr = transit - fajrHourAngle;

    const ishaHourAngle = this.calculateHourAngle(ishaAngle, latitude, declination);
    const isha = transit + ishaHourAngle;

    // Asr: Shadow ratio t = 2 (Hanafi) or t = 1 (Shafi)
    const t = isHanafi ? 2.0 : 1.0;
    const deltaRad = this.degToRad(Math.abs(latitude - declination));
    const asrAltitude = this.radToDeg(Math.atan(1.0 / (t + Math.tan(deltaRad))));
    const asrHourAngle = this.calculateHourAngle(-asrAltitude, latitude, declination);
    const asr = transit + asrHourAngle;

    return {
      fajr: this.decimalHoursToTime12H(fajr),
      sunrise: this.decimalHoursToTime12H(sunrise),
      dhuhr: this.decimalHoursToTime12H(transit),
      asr: this.decimalHoursToTime12H(asr),
      maghrib: this.decimalHoursToTime12H(sunset),
      isha: this.decimalHoursToTime12H(isha),
    };
  }

  private static calculateHourAngle(angle: number, latitude: number, declination: number): number {
    const latRad = this.degToRad(latitude);
    const decRad = this.degToRad(declination);
    const angleRad = this.degToRad(angle);

    const cosHourAngle = (-Math.sin(angleRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    const clamped = Math.max(-1.0, Math.min(1.0, cosHourAngle));
    return this.radToDeg(Math.acos(clamped)) / 15.0;
  }

  private static fixAngle(angle: number): number {
    let a = angle % 360.0;
    if (a < 0) a += 360.0;
    return a;
  }

  private static fixHour(hour: number): number {
    let h = hour % 24.0;
    if (h < 0) h += 24.0;
    return h;
  }

  private static degToRad(deg: number): number {
    return (deg * Math.PI) / 180.0;
  }

  private static radToDeg(rad: number): number {
    return (rad * 180.0) / Math.PI;
  }

  public static decimalHoursToTime12H(decimalHours: number): string {
    const totalSeconds = Math.round(this.fixHour(decimalHours) * 3600);
    const hours24 = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    const padH = hours12 < 10 ? `0${hours12}` : `${hours12}`;
    const padM = minutes < 10 ? `0${minutes}` : `${minutes}`;

    return `${padH}:${padM} ${period}`;
  }

  public static getHijriDate(date: Date = new Date(), offsetDays: number = 0): string {
    // Standard tabular Islamic calendar calculation with local moon-sighting adjustment
    const adjustedDate = new Date(date.getTime() + offsetDays * 86400000);
    const day = adjustedDate.getDate();
    const month = adjustedDate.getMonth() + 1;
    const year = adjustedDate.getFullYear();

    let m = month;
    let y = year;
    if (m < 3) {
      y -= 1;
      m += 12;
    }
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

    const epochIslamic = 1948439.5;
    const i = Math.floor((jd - epochIslamic + 0.5) / 10631);
    const r = (jd - epochIslamic + 0.5) - 10631 * i;
    const j = Math.floor((r - 0.5) / 354.366);
    const yH = 30 * i + j + 1;
    const daysInYear = Math.round(r - 354.366 * j);
    const mH = Math.min(12, Math.floor((daysInYear - 1) / 29.5) + 1);
    const dH = Math.max(1, Math.min(30, Math.floor(daysInYear - (mH - 1) * 29.5) + 1));

    const monthNames = [
      'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];

    return `${dH} ${monthNames[mH - 1] || 'Hijri'} ${yH} AH`;
  }
}

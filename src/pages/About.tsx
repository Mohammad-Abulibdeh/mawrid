import { Card, PageHeader } from '../components/ui';
import { CHLORINE_RANGE, FRC_TOXIC, TURBIDITY_LIMIT, TURBIDITY_TARGET } from '../domain/quality';
import { useI18n } from '../i18n/i18n';

const SOURCES: [string, string][] = [
  ['UNICEF, WASH in the Gaza Strip — Humanitarian Situation Update, 29 May 2026', 'https://www.unicef.org/media/181051/file/State-of-Palestine-Humanitarian-Situation-Update(WASH-in-the-Gaza-Strip),29-May-2026.pdf.pdf'],
  ['OCHA oPt, Gaza Humanitarian Response Update, 8–21 June 2025', 'https://www.ochaopt.org/content/gaza-humanitarian-response-update-8-21-june-2025'],
  ['OCHA oPt, Humanitarian Situation Update #327', 'https://www.ochaopt.org/content/humanitarian-situation-update-327-gaza-strip'],
  ['Sphere Handbook — Water supply standard 1: access and water quantity', 'https://interactive.spherestandards.org/'],
  ['IFRC, Chlorine Tablet Choice in Emergencies (2025)', 'https://wash.ifrc.org/wp-content/uploads/2025/06/Chlorine-Tablet-Choice-in-Emergencies.pdf'],
  ['MSF Medical Guidelines — Supply of safe water', 'https://medicalguidelines.msf.org/en/viewport/CHOL/english/3-3-supply-of-safe-water-23448821.html'],
  ['Oxfam — water availability in Rafah and North Gaza', 'https://www.oxfam.org/en/press-releases/less-seven-percent-pre-conflict-water-levels-available-rafah-and-north-gaza'],
  ['Journal of Water and Health (2026), WASH crisis in Gaza', 'https://doi.org/10.2166/wh.2026.271'],
];

const REPO = 'https://github.com/Mohammad-Abulibdeh/mawrid';

export default function About() {
  const { t, lang } = useI18n();
  const ar = lang === 'ar';
  const n = CHLORINE_RANGE.normal;
  const o = CHLORINE_RANGE.outbreak;

  return (
    <>
      <PageHeader title={t('nav.about')} />
      <div className="prose">
        <Card title={ar ? 'المشكلة' : 'The problem'}>
          {ar ? (
            <p>
              دُمّرت معظم البنية التحتية للمياه في قطاع غزة أو توقفت بسبب نقص الوقود وقطع الغيار. وفقًا لتقارير أوتشا واليونيسف، بلغ متوسط المياه المتاحة نحو 4.5–6 لترات للشخص يوميًا في
              أواخر آذار/مارس 2026، مقابل حد أدنى طارئ يبلغ 15 لترًا. لأن الكمية الكلية أقل بكثير من الحاجة، يجب أن تذهب كل حمولة شاحنة إلى حيث الفجوة أكبر.
            </p>
          ) : (
            <p>
              Most of the Gaza Strip’s water infrastructure has been destroyed or stopped by lack of fuel and spare parts. OCHA and UNICEF reporting puts average availability at about
              4.5–6 litres per person per day in late March 2026, against an emergency minimum of 15 L. Because total supply is far below need, every truck load has to go where the gap
              is largest. Mawrid makes that gap visible per site and proposes a fair allocation of the trucks available.
            </p>
          )}
        </Card>

        <Card title={ar ? 'المعايير المستخدمة' : 'Standards used'}>
          <table>
            <tbody>
              <tr>
                <th>{ar ? 'الكمية' : 'Quantity'}</th>
                <td>{ar ? '15 لتر/شخص/يوم هدفًا (اسفير)، و6 لترات حدًا حرجًا للشرب والطهي (مجموعة المياه والصرف الصحي في غزة)' : '15 L/person/day target (Sphere); 6 L critical floor for drinking and cooking (Gaza WASH Cluster)'}</td>
              </tr>
              <tr>
                <th>{ar ? 'المسافة' : 'Distance'}</th>
                <td>{ar ? 'أقرب نقطة مياه على بعد 500 م أو أقل' : 'Nearest water point ≤ 500 m'}</td>
              </tr>
              <tr>
                <th>{ar ? 'الحنفيات' : 'Taps'}</th>
                <td>{ar ? '250 شخصًا كحد أقصى لكل حنفية' : '≤ 250 people per tap'}</td>
              </tr>
              <tr>
                <th>{ar ? 'الكلور الحر' : 'Free residual chlorine'}</th>
                <td>
                  {n.min}–{n.max} mg/L {ar ? '(عادي)' : '(normal)'}; {o.min}–{o.max} mg/L {ar ? '(تفشٍّ)' : '(outbreak)'}; {ar ? 'غير آمن فوق' : 'unsafe above'} {FRC_TOXIC} mg/L
                </td>
              </tr>
              <tr>
                <th>{ar ? 'العكارة' : 'Turbidity'}</th>
                <td>
                  &lt; {TURBIDITY_TARGET} NTU {ar ? 'هدفًا؛ غير آمن عند' : 'target; unsafe at'} ≥ {TURBIDITY_LIMIT} NTU
                </td>
              </tr>
              <tr>
                <th>E. coli</th>
                <td>{ar ? '0 وحدة/100 مل للمياه المعالجة' : '0 CFU/100 mL in treated water'}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title={ar ? 'كيف تُحسب الأرقام' : 'How the numbers are computed'}>
          {ar ? (
            <ul>
              <li>الإمداد للموقع = متوسط اللترات الموردة يوميًا خلال آخر 7 أيام (الأيام دون توريد تُحتسب صفرًا) + الإمداد غير المنقول بالشاحنات.</li>
              <li>لتر/شخص/يوم = الإمداد ÷ عدد السكان. الفجوة = الهدف × السكان − الإمداد.</li>
              <li>جودة النقطة = نتيجة آخر فحص خلال 7 أيام. النقاط غير الآمنة لا تُحتسب للوصول ولا تُستخدم في التخطيط.</li>
              <li>مخطط التوزيع: في كل خطوة يختار الموقع ذا أكبر عجز مرجّح بالهشاشة، ويخصص له حمولة واحدة من أقرب مصدر صالح ما زالت لديه طاقة، حتى تنفد الرحلات أو المياه أو تبلغ كل المواقع الهدف.</li>
            </ul>
          ) : (
            <ul>
              <li>Site supply = average litres trucked per day over the last 7 days (days with no delivery count as zero) + non-trucked supply.</li>
              <li>L/person/day = supply ÷ population. Gap = target × population − supply.</li>
              <li>Point quality = result of the latest test within 7 days. Unsafe points do not count for access and are never used in planning.</li>
              <li>
                Dispatch planner (max-min fairness): at each step it takes the site with the largest vulnerability-weighted shortfall and assigns it one load from the nearest usable
                source that still has capacity within the haul limit — until trips or water run out, or every site reaches the target. Each step is explainable to a site committee.
              </li>
              <li>Priority score = (relative shortfall + 0.5 if below critical + 0.25 if no tap within 500 m) × vulnerability × log₁₀(population).</li>
            </ul>
          )}
        </Card>

        <Card title={ar ? 'الخصوصية والعمل دون اتصال' : 'Privacy and offline use'}>
          {ar ? (
            <p>
              لا يُرسل أي شيء إلى خادم. البيانات محفوظة في هذا المتصفح فقط وتُنقل بين الأجهزة عبر ملفات JSON أو CSV. لا يخزن التطبيق أسماء أو أرقام هواتف أو مواقع أسر — فقط أعداد إجمالية
              لكل موقع. بعد الزيارة الأولى يعمل التطبيق دون اتصال؛ فقط بلاطات الخريطة تحتاج إلى الإنترنت.
            </p>
          ) : (
            <p>
              Nothing is sent to a server. Data stays in this browser and moves between devices as JSON or CSV files. The app stores no names, phone numbers or household locations — only
              site-level totals. After the first visit the app works offline; only map tiles need the internet.
            </p>
          )}
          <p>
            <strong>{ar ? 'البيانات التجريبية مصطنعة' : 'The demo data is synthetic'}</strong>
            {ar ? ' ولا تمثل مواقع أو منشآت حقيقية.' : ' and does not describe real sites or facilities.'}
          </p>
        </Card>

        <Card title={ar ? 'المصادر' : 'Sources'}>
          <ol>
            {SOURCES.map(([label, url]) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ol>
          <p>
            {ar ? 'الشيفرة المصدرية والتوثيق: ' : 'Source code and documentation: '}
            <a href={REPO} target="_blank" rel="noreferrer">
              {REPO}
            </a>
          </p>
        </Card>
      </div>
    </>
  );
}

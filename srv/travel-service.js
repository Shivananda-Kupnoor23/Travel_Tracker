const cds = require('@sap/cds');
const { askChatbot } = require('./chatbot-handler');

module.exports = cds.service.impl(async function () {
  const { Employees, Travels } = this.entities;

  // Auto-update travel status on every READ
  this.before('READ', 'Travels', async (req) => {
    const today = new Date().toISOString().split('T')[0];
    const db = await cds.connect.to('db');
    // Approved -> Travelling if startDate <= today
    await db.run(
      UPDATE(Travels)
        .set({ status: 'Travelling' })
        .where({ status: 'Approved', startDate: { '<=': today }, endDate: { '>=': today } })
    );
    // Travelling -> Completed if endDate < today
    await db.run(
      UPDATE(Travels)
        .set({ status: 'Completed' })
        .where({ status: 'Travelling', endDate: { '<': today } })
    );
  });

  // ===================== DASHBOARD FUNCTIONS =====================

  this.on('getDashboardStats', async () => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const future7 = futureDate.toISOString().split('T')[0];

    const db = await cds.connect.to('db');

    const travellingToday = await db.run(
      SELECT.from(Travels).columns('count(1) as count')
        .where({ startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
    );

    const upcoming = await db.run(
      SELECT.from(Travels).columns('count(1) as count')
        .where({ startDate: { '>': today, '<=': future7 } })
    );

    const returning = await db.run(
      SELECT.from(Travels).columns('count(1) as count')
        .where({ endDate: today, status: { in: ['Travelling'] } })
    );

    const abroad = await db.run(
      SELECT.from(Travels).columns('count(1) as count')
        .where({ travelType: 'International', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
    );

    const countries = await db.run(
      SELECT.from(Travels).columns('count(distinct toCountry) as count')
        .where({ travelType: 'International', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
    );

    const domestic = await db.run(
      SELECT.from(Travels).columns('count(1) as count')
        .where({ travelType: 'Domestic', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
    );

    const international = await db.run(
      SELECT.from(Travels).columns('count(1) as count')
        .where({ travelType: 'International', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
    );

    return {
      travellingToday: travellingToday[0].count,
      upcoming7Days: upcoming[0].count,
      returningToday: returning[0].count,
      abroadNow: abroad[0].count,
      countriesCount: countries[0].count,
      domesticToday: domestic[0].count,
      internationalToday: international[0].count
    };
  });

  this.on('getTravellingToday', async () => {
    const today = new Date().toISOString().split('T')[0];
    return await SELECT.from(Travels)
      .columns(t => { t`.*`, t.employee(e => { e.name, e.department, e.email }) })
      .where({ startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } });
  });

  this.on('getUpcomingTravel', async () => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const future7 = futureDate.toISOString().split('T')[0];
    return await SELECT.from(Travels)
      .columns(t => { t`.*`, t.employee(e => { e.name, e.department, e.email }) })
      .where({ startDate: { '>': today, '<=': future7 } });
  });

  this.on('getReturningToday', async () => {
    const today = new Date().toISOString().split('T')[0];
    return await SELECT.from(Travels)
      .columns(t => { t`.*`, t.employee(e => { e.name, e.department, e.email }) })
      .where({ endDate: today, status: 'Travelling' });
  });

  this.on('getCurrentlyAbroad', async () => {
    const today = new Date().toISOString().split('T')[0];
    return await SELECT.from(Travels)
      .columns(t => { t`.*`, t.employee(e => { e.name, e.department, e.email }) })
      .where({ travelType: 'International', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } });
  });

  this.on('getCountryDistribution', async () => {
    const today = new Date().toISOString().split('T')[0];
    const db = await cds.connect.to('db');
    return await db.run(
      SELECT.from(Travels)
        .columns('toCountry as country', 'count(1) as count')
        .where({ travelType: 'International', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
        .groupBy('toCountry')
        .orderBy({ count: 'desc' })
    );
  });

  this.on('getDomesticDistribution', async () => {
    const today = new Date().toISOString().split('T')[0];
    const db = await cds.connect.to('db');
    return await db.run(
      SELECT.from(Travels)
        .columns('toCity as city', 'count(1) as count')
        .where({ travelType: 'Domestic', startDate: { '<=': today }, endDate: { '>=': today }, status: { in: ['Travelling', 'Approved'] } })
        .groupBy('toCity')
        .orderBy({ count: 'desc' })
    );
  });

  this.on('getCalendarData', async (req) => {
    const { year, month } = req.data;
    const db = await cds.connect.to('db');
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const travelling = await db.run(
        SELECT.from(Travels).columns('count(1) as count')
          .where({ startDate: { '<=': dateStr }, endDate: { '>=': dateStr }, status: { in: ['Travelling', 'Approved', 'Completed'] } })
      );
      const returning = await db.run(
        SELECT.from(Travels).columns('count(1) as count')
          .where({ endDate: dateStr })
      );
      const departing = await db.run(
        SELECT.from(Travels).columns('count(1) as count')
          .where({ startDate: dateStr })
      );

      result.push({
        date: dateStr,
        travelling: travelling[0].count,
        returning: returning[0].count,
        departing: departing[0].count
      });
    }
    return result;
  });

  // ===================== LOGIN =====================

  this.on('login', async (req) => {
    const { email, password } = req.data;
    if (!email || !password) {
      return { success: false, message: 'Email and password are required' };
    }
    const employee = await SELECT.one.from(Employees).where({ email: email });
    if (!employee) {
      return { success: false, message: 'Invalid email address' };
    }
    if (employee.password !== password) {
      return { success: false, message: 'Incorrect password' };
    }
    return {
      success: true,
      employeeId: employee.ID,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      message: 'Login successful'
    };
  });

  // ===================== CHATBOT =====================

  this.on('askChatbot', async (req) => {
    const { question } = req.data;
    if (!question) return { answer: 'Please ask a question.', data: [], sql: '', success: false };
    const db = await cds.connect.to('db');
    return await askChatbot(question, db);
  });

  // ===================== ADMIN ACTIONS =====================

  this.on('approveTravel', async (req) => {
    const { travelId } = req.data;
    const travel = await SELECT.one.from(Travels).where({ ID: travelId });
    if (!travel) return req.error(404, 'Travel not found');
    if (travel.status !== 'Planned') return req.error(400, 'Only Planned travel can be approved');
    await UPDATE(Travels).set({ status: 'Approved' }).where({ ID: travelId });
    return await SELECT.one.from(Travels).where({ ID: travelId });
  });

  this.on('rejectTravel', async (req) => {
    const { travelId } = req.data;
    const travel = await SELECT.one.from(Travels).where({ ID: travelId });
    if (!travel) return req.error(404, 'Travel not found');
    if (travel.status !== 'Planned') return req.error(400, 'Only Planned travel can be rejected');
    await UPDATE(Travels).set({ status: 'Cancelled' }).where({ ID: travelId });
    return await SELECT.one.from(Travels).where({ ID: travelId });
  });

  this.on('cancelTravel', async (req) => {
    const { travelId } = req.data;
    const travel = await SELECT.one.from(Travels).where({ ID: travelId });
    if (!travel) return req.error(404, 'Travel not found');
    if (['Completed', 'Cancelled'].includes(travel.status)) {
      return req.error(400, 'Cannot cancel completed or already cancelled travel');
    }
    await UPDATE(Travels).set({ status: 'Cancelled' }).where({ ID: travelId });
    return await SELECT.one.from(Travels).where({ ID: travelId });
  });
});

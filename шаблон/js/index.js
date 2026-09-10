// --- Управление данными ---

const BOOKINGS_KEY = 'hotelBookings';
const ADMIN_SESSION_KEY = 'isAdminLoggedIn';

// Получить все заявки из localStorage
function getBookings() {
    const bookings = localStorage.getItem(BOOKINGS_KEY);
    return bookings ? JSON.parse(bookings) : [];
}

// Сохранить все заявки в localStorage
function saveBookings(bookings) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

// Добавить новую заявку
function addBooking(booking) {
    const bookings = getBookings();
    // Генерируем уникальный ID для заявки
    booking.id = Date.now().toString();
    booking.status = 'На рассмотрении'; // Начальный статус
    bookings.push(booking);
    saveBookings(bookings);
}

// Обновить статус заявки
function updateBookingStatus(bookingId, newStatus) {
    const bookings = getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = newStatus;
        saveBookings(bookings);
    }
}

// Удалить заявку
function deleteBooking(bookingId) {
    let bookings = getBookings();
    bookings = bookings.filter(b => b.id !== bookingId);
    saveBookings(bookings);
}

// --- Управление сессией администратора ---

// Проверить, вошел ли администратор
function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

// Выйти из режима администратора
function logoutAdmin() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = 'index.html'; // Перенаправляем на главную
}

// --- Вспомогательные функции ---

// Форматирование даты в 'YYYY-MM-DD'
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Проверка, занят ли номер на указанные даты
function isRoomBooked(roomCategory, checkInDate, checkOutDate) {
    const bookings = getBookings();
    const newCheckIn = new Date(checkInDate);
    const newCheckOut = new Date(checkOutDate);

    return bookings.some(booking => {
        // Нас интересуют только одобренные брони на этот же номер
        if (booking.status !== 'Одобрена' || booking.roomCategory !== roomCategory) {
            return false;
        }

        const existingCheckIn = new Date(booking.checkInDate);
        const existingCheckOut = new Date(booking.checkOutDate);

        // Проверка на пересечение периодов
        // Новый период начинается до окончания старого И новый период заканчивается после начала старого
        return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
    });
}


// --- Инициализация при загрузке страницы ---
$(document).ready(function () {
    // Маска для телефона
    $('#validationCustomPhone').inputmask({ "mask": "+7(999)999-99-99" });

    // --- Логика для страницы order.html ---
    if ($('#booking-form').length) {
        const checkInInput = $('#checkInDate');
        const checkOutInput = $('#checkOutDate');
        const roomSelect = $('#roomCategory');
        const bookingForm = $('#booking-form');
        const errorMessage = $('#date-error');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Убираем время, чтобы сравнивать только даты

        // Устанавливаем минимальную дату для заезда
        checkInInput.attr('min', formatDate(today));

        // При изменении даты заезда, обновляем минимальную дату для выезда
        checkInInput.on('change', function () {
            const selectedCheckIn = new Date($(this).val());
            const nextDay = new Date(selectedCheckIn);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutInput.attr('min', formatDate(nextDay));
            if (new Date(checkOutInput.val()) <= selectedCheckIn) {
                checkOutInput.val('');
            }
        });

        // Обработка отправки формы
        bookingForm.on('submit', function (e) {
            e.preventDefault();
            errorMessage.text('').hide();

            // Стандартная валидация Bootstrap
            if (!this.checkValidity()) {
                $(this).addClass('was-validated');
                return;
            }

            const roomCategory = roomSelect.val();
            const checkInDate = checkInInput.val();
            const checkOutDate = checkOutInput.val();

            // Пользовательская валидация
            if (new Date(checkInDate) >= new Date(checkOutDate)) {
                errorMessage.text('Дата выезда должна быть позже даты заезда.').show();
                return;
            }
            
            if (isRoomBooked(roomCategory, checkInDate, checkOutDate)) {
                errorMessage.text('К сожалению, номер этой категории уже забронирован на выбранные даты. Пожалуйста, выберите другие даты или категорию.').show();
                return;
            }

            // Создание и сохранение заявки
            const newBooking = {
                firstName: $('#firstName').val(),
                lastName: $('#lastName').val(),
                phone: $('#validationCustomPhone').val(),
                email: $('#email').val(),
                roomCategory: roomCategory,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
            };
            addBooking(newBooking);

            // Показываем сообщение об успехе
            $('#booking-form').hide();
            $('#success-message').show();
        });
    }
});

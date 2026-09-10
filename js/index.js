// --- Управление данными ---

const BOOKINGS_KEY = 'hotelBookings';

function getBookings() {
    try {
        const data = localStorage.getItem(BOOKINGS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Ошибка чтения заявок:', e);
        return [];
    }
}

function saveBookings(bookings) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function addBooking(booking) {
    const bookings = getBookings();
    booking.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    booking.status = 'На рассмотрении';
    bookings.push(booking);
    saveBookings(bookings);
}

// --- Вспомогательные функции ---

function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function isRoomBooked(roomCategory, checkInDate, checkOutDate) {
    const bookings = getBookings();
    const newCheckIn = new Date(checkInDate);
    const newCheckOut = new Date(checkOutDate);

    return bookings.some(booking => {
        if (booking.status !== 'Одобрена' || booking.roomCategory !== roomCategory) {
            return false;
        }

        const existingCheckIn = new Date(booking.checkInDate);
        const existingCheckOut = new Date(booking.checkOutDate);

        return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
    });
}

// --- Инициализация при загрузке ---

$(document).ready(function () {
    // Маска для телефона (если поле есть на странице)
    if ($('#validationCustomPhone').length) {
        $('#validationCustomPhone').inputmask({ "mask": "+7(999)999-99-99" });
    }

    // --- Логика для страницы order.html ---
    if ($('#booking-form').length) {
        const checkInInput = $('#checkInDate');
        const checkOutInput = $('#checkOutDate');
        const roomSelect = $('#roomCategory');
        const bookingForm = $('#booking-form');
        const errorMessage = $('#date-error');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        checkInInput.attr('min', formatDate(today));

        checkInInput.on('change', function () {
            const selectedCheckIn = new Date($(this).val());
            const nextDay = new Date(selectedCheckIn);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutInput.attr('min', formatDate(nextDay));
            if (new Date(checkOutInput.val()) <= selectedCheckIn) {
                checkOutInput.val('');
            }
        });

        bookingForm.on('submit', function (e) {
            e.preventDefault();
            errorMessage.text('').hide();

            if (!this.checkValidity()) {
                $(this).addClass('was-validated');
                return;
            }

            const roomCategory = roomSelect.val();
            const checkInDate = checkInInput.val();
            const checkOutDate = checkOutInput.val();

            if (new Date(checkInDate) >= new Date(checkOutDate)) {
                errorMessage.text('Дата выезда должна быть позже даты заезда.').show();
                return;
            }

            if (isRoomBooked(roomCategory, checkInDate, checkOutDate)) {
                errorMessage.text('К сожалению, номер этой категории уже забронирован на выбранные даты. Пожалуйста, выберите другие даты или категорию.').show();
                return;
            }

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

            $('#booking-form').hide();
            $('#success-message').show();
        });
    }
});

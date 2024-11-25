$(function () {
    console.log('START');

    // Const for Timetable
    const num = 5; //anzahl verbindungen
    const pre = 1; //anzahl verbindungen vor aktueller zeit
    const time_type = 'depart'; //Abfahrt oder Ankunft

    // set date and time on startup
    $('#date').val(moment().format('YYYY-MM-DD'));
    $('#time').val(moment().format('HH:mm'));

    //get localstorage on startup
    if (localStorage.getItem('from')) {
        $('#from').val(localStorage.getItem('from'));
    }

    if (localStorage.getItem('to')) {
        $('#to').val(localStorage.getItem('to'));
    }

    //set localStorage on leaving the input
    $('#from').on('blur', function () {
        localStorage.setItem('from', $(this).val());
    });

    $('#to').on('blur', function () {
        localStorage.setItem('to', $(this).val());
    });

    // reset button
    $('#reset').on('click', function (e) {
        e.preventDefault();
        $('#output').empty();
        $('#from').val('');
        $('#to').val('');
        localStorage.clear();
        $('#date').val(moment().format('YYYY-MM-DD'));
        $('#time').val(moment().format('HH:mm'));
    });

    /** Tooltip */
    // Tooltip initialisieren
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Tooltip nach Klick ausblenden
    $('#reset').on('click', function () {
        $(this).tooltip('hide');
    });

    $('#submit').on('click', function () {
        $(this).tooltip('hide');
    });

    // autocomplete from -> jQuery UI
    $("#from").autocomplete({
        open: function () {
            $("ul.ui-menu").width($(this).innerWidth());
        },
        source: function (request, response) {
            $.ajax({
                url: "https://search.ch/timetable/api/completion.en.json",
                dataType: "json",
                data: { term: request.term },
                success: function (data) {
                    response(data);
                },
                error: function () {
                    response([]);
                }
            });
        },
        minLength: 3
    });

    // autocomplete to -> jQuery UI
    $("#to").autocomplete({
        open: function () {
            $("ul.ui-menu").width($(this).innerWidth());
        },
        source: function (request, response) {
            $.ajax({
                url: "https://search.ch/timetable/api/completion.en.json",
                dataType: "json",
                data: { term: request.term },
                success: function (data) {
                    response(data);
                },
                error: function () {
                    response([]);
                }
            });
        },
        minLength: 3
    });

    // on submit form
    $('#fahrplan').on('submit', function (e) {
        e.preventDefault(); // prevent default
        $('#output').empty(); // clear output

        let from = $('#from').val();
        let to = $('#to').val();
        let date = $('#date').val();
        let time = $('#time').val();

        $.getJSON("https://search.ch/timetable/api/route.en.json", {
            from: from,
            to: to,
            date: date,
            time: time,
            num: num,
            pre: pre,
            time_type: time_type
        }).done(function (data) {
            if (data.connections.length > 0) {
                let accordionHtml = '<div class="accordion" id="connectionsAccordion">';
                data.connections.forEach((connection, index) => {
                    let connectionId = `connection${index}`;
                    accordionHtml += `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading${connectionId}">
                                <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${connectionId}" aria-expanded="${index === 0}" aria-controls="collapse${connectionId}">
                                    Abfahrt: ${moment(connection.departure).format('HH:mm')} Uhr - Ankunft: ${moment(connection.arrival).format('HH:mm')} Uhr
                                </button>
                            </h2>
                            <div id="collapse${connectionId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading${connectionId}" data-bs-parent="#connectionsAccordion">
                                <div class="accordion-body">
                                    <ul>
                    `;

                    connection.legs.forEach(leg => {
                        if (leg.stops === null) {
                            accordionHtml += `<li>${moment(leg.arrival).format('HH:mm')} Uhr, ${leg.name} an</li>`;
                        } else {
                            accordionHtml += `<li>${moment(leg.departure).format('HH:mm')} Uhr, Gleis: ${leg.track}, ${leg.type} ${leg.line} - ${leg.name} Richtung ${leg.terminal}</li>`;
                        }
                    });

                    accordionHtml += `
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                });

                accordionHtml += '</div>';
                $('#output').append(accordionHtml);

            } else {
                $('#output').html('Die Anfrage liefert kein Resultat');
            }
        }).fail(function () {
            $('#output').html('Es ist ein Fehler aufgetreten - versuchen Sie es später nochmals');
        });
    });
});
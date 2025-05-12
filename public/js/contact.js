// contact form
console.log("Contact form script loaded");
$(document).ready(function () {
  $(".contact-form").on("submit", function (e) {
    e.preventDefault();

    let formData = {
      name: $("#name").val(),
      email: $("#email").val(),
      subject: $("#subject").val(),
      message: $("#message").val(),
    };

    $.ajax({
      url: "/contact",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(formData),
      success: function (response) {
        console.log(response);
        if (response === "success") {
          alert("Email Sent");
          $("#name").val("");
          $("#email").val("");
          $("#subject").val("");
          $("#message").val("");
        } else {
          alert("Something Went Wrong");
        }
      },
      error: function(xhr, status, error) {
        console.error("Error details:", error);
        alert("Error sending email: " + error);
      }
    });
    console.log("Form submitted");
  });
});
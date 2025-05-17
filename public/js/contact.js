// First check if jQuery is loaded
if (typeof $ === "undefined") {
  console.error("jQuery is not loaded! Form functionality won't work.");
  // Try to load jQuery dynamically if it's missing
  const script = document.createElement("script");
  script.src =
    "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js";
  script.onload = function () {
    console.log("jQuery was loaded dynamically");
    initializeForm();
  };
  document.head.appendChild(script);
} else {
  console.log("jQuery is already loaded");
  initializeForm();
}

function initializeForm() {
  console.log("Contact form script loaded");

  $(document).ready(function () {
    console.log("Document ready, binding form submission");

    $(".contact-form").on("submit", function (e) {
      console.log("Form submit triggered");
      e.preventDefault();

      // Collect form data
      let formData = {
        name: $("#name").val(),
        email: $("#email").val(),
        subject: $("#subject").val(),
        message: $("#message").val(),
      };

      console.log("Sending form data:", formData);

      // Send AJAX request to the server
      $.ajax({
        url: "/contact",
        method: "POST",
        data: formData, // Send as regular form data
        success: function (response) {
          console.log("Server response:", response);
          if (response === "success") {
            alert("Email Sent Successfully!");
            // Clear form fields
            $("#name").val("");
            $("#email").val("");
            $("#subject").val("");
            $("#message").val("");
          } else {
            alert(
              "Something went wrong sending your message. Please try again later."
            );
          }
        },
        error: function (xhr, status, error) {
          console.error("AJAX error details:", {
            status,
            error,
            response: xhr.responseText,
          });
          alert("Error sending your message: " + xhr.status + " " + error);
        },
      });
    });
  });
}

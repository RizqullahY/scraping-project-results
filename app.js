$(function () {
  const repo = "RizqullahY/scraping-project-results";
  const perPage = 8;

  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;

  let cache = {};
  let allData = [];

  function extractImage(body) {
    if (!body) return "";
    const match = body.match(/<img[^>]+src="([^"]+)"/);
    return match ? match[1] : "";
  }

  function fetchReleases(page, reset = false) {
    if (isLoading || !hasMore) return;

    isLoading = true;
    $("#loading").removeClass("hidden");

    if (reset) {
      $("#releaseList").empty();
      cache = {};
      allData = [];
      currentPage = 1;
      hasMore = true;
      $("#loadMore").show();
    }

    if (cache[page]) {
      render(cache[page]);
      isLoading = false;
      $("#loading").addClass("hidden");
      return;
    }

    $.getJSON(
      `https://api.github.com/repos/${repo}/releases?page=${page}&per_page=${perPage}`,
      function (data) {
        if (data.length < perPage) {
          hasMore = false;
          $("#loadMore").hide();
        }

        cache[page] = data;
        allData = allData.concat(data);

        render(data);
      },
    ).always(function () {
      isLoading = false;
      $("#loading").addClass("hidden");
    });
  }

  function render(releases) {
    releases.forEach((release) => {
      const imageUrl = extractImage(release.body);

      const card = `
        <div class="bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition p-5">
          <div class="flex gap-4">
            ${
              imageUrl
                ? `
              <img src="${imageUrl}" 
                class="w-32 h-44 object-cover rounded-xl border border-slate-700">
            `
                : ``
            }
            <div class="flex-1">
              <h2 class="text-lg font-semibold mb-3">
                ${release.name || release.tag_name}
              </h2>

              <button 
                class="viewAssets px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition text-sm"
                data-assets='${encodeURIComponent(JSON.stringify(release.assets))}'
                data-title="${release.name || release.tag_name}">
                View Assets (${release.assets.length})
              </button>
            </div>
          </div>
        </div>
      `;

      $("#releaseList").append(card);
    });
  }

  $("#loadMore").click(function () {
    currentPage++;
    fetchReleases(currentPage);
  });

  $("#refreshBtn").click(function () {
    fetchReleases(1, true);
  });

  $("#search").on("input", function () {
    const keyword = $(this).val().toLowerCase();
    $("#releaseList").empty();

    const filtered = allData.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(keyword)) ||
        (r.tag_name && r.tag_name.toLowerCase().includes(keyword)),
    );

    render(filtered);
  });

  $(document).on("click", ".viewAssets", function () {
    const assets = JSON.parse(decodeURIComponent($(this).attr("data-assets")));
    const title = $(this).attr("data-title");

    $("#modalTitle").text(title);
    $("#modalContent").empty();

    if (assets.length === 0) {
      $("#modalContent").html(
        `<p class="text-slate-400">No assets available</p>`,
      );
    } else {
      assets.forEach((asset) => {
        const sizeMB = (asset.size / 1024 / 1024).toFixed(2);

        $("#modalContent").append(`
          <div class="flex justify-between items-center bg-slate-700/50 px-3 py-2 rounded-xl">
            <div>
              <p class="text-sm font-medium">${asset.name}</p>
              <p class="text-xs text-slate-400">${sizeMB} MB</p>
            </div>
            <a href="${asset.browser_download_url}" 
               target="_blank"
               class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded-lg transition">
              Download
            </a>
          </div>
        `);
      });
    }

    $("#assetModal").removeClass("hidden").addClass("flex");
  });

  $("#closeModal").click(function () {
    $("#assetModal").addClass("hidden").removeClass("flex");
  });

  $("#assetModal").click(function (e) {
    if (e.target.id === "assetModal") {
      $(this).addClass("hidden").removeClass("flex");
    }
  });

  $(document).keyup(function (e) {
    if (e.key === "Escape") {
      $("#assetModal").addClass("hidden").removeClass("flex");
    }
  });

  fetchReleases(currentPage);
});

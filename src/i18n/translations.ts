const translations = {
  en: {
    // Locale toggle
    "locale.switchTo": "Switch to Turkish",
    "locale.current": "EN",

    // Layout
    "layout.title": "3D OCT Viewer",
    "layout.guide": "Guide",

    // Home page
    "home.title": "Patients",
    "home.newPatient": "New Patient",
    "home.empty.title": "No patients yet",
    "home.empty.description":
      "Create your first patient to start uploading and viewing OCT scans.",
    "home.loading": "Loading...",
    "home.actions": "Actions",
    "home.rename": "Rename",
    "home.delete": "Delete",
    "home.images": "images",
    "home.created": "Created",
    "home.eye": "Eye",

    // New patient dialog
    "home.dialog.new.title": "New Patient",
    "home.dialog.new.description":
      "Enter a name and select the eye for this patient.",
    "home.dialog.new.nameLabel": "Name",
    "home.dialog.new.namePlaceholder": "e.g. John Doe",
    "home.dialog.new.eyeLabel": "Eye",
    "home.dialog.new.cancel": "Cancel",
    "home.dialog.new.create": "Create",
    "home.dialog.new.creating": "Creating...",

    // Rename dialog
    "home.dialog.rename.title": "Rename Patient",
    "home.dialog.rename.description": "Enter a new name for this patient.",
    "home.dialog.rename.placeholder": "Patient name",
    "home.dialog.rename.cancel": "Cancel",
    "home.dialog.rename.save": "Save",
    "home.dialog.rename.saving": "Saving...",

    // Delete dialog
    "home.dialog.delete.title": "Delete Patient",
    "home.dialog.delete.description": "Are you sure you want to delete",
    "home.dialog.delete.warning":
      "? This will permanently remove the patient and all associated images. This action cannot be undone.",
    "home.dialog.delete.cancel": "Cancel",
    "home.dialog.delete.confirm": "Delete",
    "home.dialog.delete.deleting": "Deleting...",

    // Toast messages
    "toast.patientCreated": "Patient created",
    "toast.patientCreateFailed": "Failed to create patient",
    "toast.patientRenamed": "Patient renamed",
    "toast.patientRenameFailed": "Failed to rename patient",
    "toast.patientDeleted": "Patient deleted",
    "toast.patientDeleteFailed": "Failed to delete patient",
    "toast.uploadedImages": "Uploaded {count} images",
    "toast.uploadImagesFailed": "Failed to upload images",
    "toast.uploadedMasks": "Uploaded {count} masks",
    "toast.uploadMasksFailed": "Failed to upload masks",
    "toast.detectedLabels": "Detected {count} new label(s)",
    "toast.removed": "Removed {filename}",
    "toast.removeFailed": "Failed to remove image",
    "toast.removeMaskFailed": "Failed to remove mask",

    // Patient detail page
    "patient.backToPatients": "Back to patients",
    "patient.toggleEye": "Click to toggle eye",
    "patient.viewIn3D": "View in 3D",
    "patient.uploadMasksFirst": "Upload masks to enable 3D view",
    "patient.octImages": "OCT Images",
    "patient.masks": "Masks",
    "patient.loading": "Loading...",
    "patient.notFound": "Patient not found.",

    // Upload zones
    "upload.uploading": "Uploading...",
    "upload.uploadingMasks": "Uploading & analyzing masks...",
    "upload.dropFiles": "Drop files here...",
    "upload.dropMasks": "Drop mask files here...",
    "upload.addMoreOct": "Add more OCT images",
    "upload.addMoreMasks": "Add more mask images",
    "upload.dragDropOct": "Drag & drop OCT images, or click to browse",
    "upload.dragDropMasks": "Drag & drop mask images, or click to browse",
    "upload.fileTypes": "PNG, JPG files accepted",

    // Mask grid
    "maskGrid.empty": "No masks uploaded yet",

    // Label config
    "labelConfig.title": "Label Configuration",
    "labelConfig.cycleColor": "Click to cycle color",

    // Image viewer
    "viewer.loading": "Loading...",
    "viewer.hideEdges": "Hide edges",
    "viewer.showEdges": "Show edges",
    "viewer.edgeWidth": "Edge width",

    // 3D viewer
    "viewer3d.loading": "Loading...",
    "viewer3d.loadingMasks": "Loading masks...",
    "viewer3d.buildingVolume": "Building 3D volume...",
    "viewer3d.calculatingETDRS": "Calculating ETDRS volumes...",
    "viewer3d.generatingMeshes": "Generating 3D meshes...",
    "viewer3d.generatingMesh": "Generating mesh: {name}...",
    "viewer3d.noLabels": "No labels found in masks",
    "viewer3d.noMasks": "No masks found",
    "viewer3d.noMeshes": "No meshes generated",
    "viewer3d.dimensions": "Dimensions",
    "viewer3d.eye": "Eye",
    "viewer3d.meshCount": "Meshes",
    "viewer3d.controlsRotate": "Rotate",
    "viewer3d.controlsPan": "Pan",
    "viewer3d.controlsZoom": "Zoom",
    "viewer3d.leftClick": "Left Click:",
    "viewer3d.rightClick": "Right Click:",
    "viewer3d.scroll": "Scroll:",
    "viewer3d.close": "Close",
    "viewer3d.layers": "Layers",
    "viewer3d.back": "Back",

    // Sidebar 3D
    "sidebar.title": "3D Visualization",
    "sidebar.subtitle": "OCT Segmentation Layers",
    "sidebar.export": "Export Measurements (CSV)",
    "sidebar.avgThickness": "Average Thickness",
    "sidebar.volumeMeasurements": "Volume Measurements",
    "sidebar.layersCount": "Layers ({count})",
    "sidebar.opacity": "Opacity",
    "sidebar.vertices": "{count} vertices",
    "sidebar.slicesCount": "Slices ({valid}/{total})",
    "sidebar.show": "Show",
    "sidebar.hide": "Hide",
    "sidebar.showAll": "Show All",
    "sidebar.hideAll": "Hide All",
    "sidebar.validOnly": "Valid Only",
    "sidebar.crossSection": "Cross Section",

    // ETDRS Grid
    "etdrs.titleVolume": "Volume",
    "etdrs.titleThickness": "Average Thickness",
    "etdrs.nasal": "N",
    "etdrs.temporal": "T",
    "etdrs.superior": "S",
    "etdrs.inferior": "I",

    // Guide page
    "guide.title": "Usage Guide",
    "guide.description":
      "Learn how to use the 3D OCT Viewer for segmentation visualization and quantitative analysis.",
    "guide.s1.title": "1. Overview",
    "guide.s1.content":
      "3D OCT Viewer is a web-based analysis tool for visualizing and quantifying OCT (Optical Coherence Tomography) segmentation masks in interactive 3D. It computes ETDRS-based volume measurements and average layer thicknesses in real physical scale, and renders 3D meshes of retinal layers and fluid accumulations. All processing runs entirely in your browser, no server or data upload is required.",
    "guide.s2.title": "2. Getting Started",
    "guide.s2.step1.label": "Create a Patient",
    "guide.s2.step1.text":
      'Click "New Patient" on the home page. Enter a name and select the eye laterality (OD or OS).',
    "guide.s2.step2.label": "Upload OCT Images",
    "guide.s2.step2.text":
      'Open the patient page, switch to the "OCT Images" tab, and drag-and-drop your OCT images (PNG or JPG). File names should follow a natural order (e.g., p1.png through p25.png).',
    "guide.s2.step3.label": "Upload Segmentation Masks",
    "guide.s2.step3.text":
      'Switch to the "Masks" tab and upload the corresponding segmentation mask PNGs. Each pixel\'s R-channel value represents a label ID (0 = background, 1–N = tissue classes). Filenames must match the OCT images for correct pairing.',
    "guide.s2.step4.label": "Configure Labels",
    "guide.s2.step4.text":
      "After uploading masks, detected labels appear in the sidebar. Rename them (e.g., Layer 1 → NSR, Layer 3 → SRF) and assign colors by clicking the color swatch.",
    "guide.s3.title": "3. Image Viewer",
    "guide.s3.content":
      "Click any OCT image thumbnail to open the full-screen viewer. When both images and masks are uploaded for the same eye, colored edges of each segmentation label are automatically overlaid on the OCT images.",
    "guide.s3.f1":
      "Zoom in/out with scroll wheel or the on-screen controls, pan by clicking and dragging",
    "guide.s3.f2":
      "Navigate between images with arrow keys or the bottom controls",
    "guide.s3.f3": "Toggle edge overlay with the Layers button (bottom-left)",
    "guide.s3.f4":
      "Adjust edge thickness with the slider in the legend panel (bottom-right)",
    "guide.s4.title": "4. 3D Visualization",
    "guide.s4.content":
      'Click "View in 3D" on the patient page to generate interactive 3D meshes from the segmentation masks. The pipeline uses marching cubes with Z-axis interpolation, anisotropic Gaussian blur, and Taubin smoothing to produce smooth, volume-preserving surfaces.',
    "guide.s4.f1": "Rotate: left-click and drag",
    "guide.s4.f2": "Pan: right-click and drag",
    "guide.s4.f3": "Zoom: scroll wheel",
    "guide.s4.f4": "Per-layer visibility toggles and opacity sliders",
    "guide.s4.f5":
      "Cross-section slider to clip the volume along the depth axis",
    "guide.s4.f6":
      "Slices panel: toggle the slice grid to see where each uploaded image corresponds to in the 3D render, show or hide individual slices to inspect specific cross-sections within the volume",
    "guide.s5.title": "5. Measurements",
    "guide.s5.content":
      "All measurements are computed in real physical scale using the default OCT spacings (X: 11.54 µm, Y: 3.87 µm, Z: 246.0 µm).",
    "guide.s5.f1":
      "Average thickness (µm): mean layer thickness across all D×W columns",
    "guide.s5.f2": "Total volume (nL): overall volume per label",
    "guide.s5.f3":
      "ETDRS volumes (nL): per-region volumes displayed on a 9-sector circular grid",
    "guide.s5.f4":
      "ETDRS regions: center (1 mm), inner ring (3 mm), outer ring (6 mm)",
    "guide.s5.f5":
      "Nasal/Temporal orientation adapts to the selected eye (OD vs OS)",
    "guide.s5.f6":
      "Export all measurements to CSV via the sidebar export button",
    "guide.s6.title": "6. Input Format",
    "guide.s6.content":
      "Masks must be grayscale PNGs where each pixel value encodes a class label (R channel). A typical set-up:",
    "guide.s6.th1": "Pixel value",
    "guide.s6.th2": "Meaning",
    "guide.s6.r1": "Background",
    "guide.s6.r2": "NSR (Neurosensory Retina)",
    "guide.s6.r3": "RPE (Retinal Pigment Epithelium)",
    "guide.s6.r4": "SRF (Sub-Retinal Fluid)",
    "guide.s6.r5": "PED (Pigment Epithelial Detachment)",
    "guide.s6.r6": "Additional custom labels",
    "guide.s7.title": "7. Data Privacy",
    "guide.s7.content":
      "All data (images, masks, measurements) is stored locally in your browser's IndexedDB. Nothing is uploaded to any server. Clearing your browser data will remove all stored patients and images.",
  },

  tr: {
    // Locale toggle
    "locale.switchTo": "İngilizce'ye geç",
    "locale.current": "TR",

    // Layout
    "layout.title": "3D OCT Görüntüleyici",
    "layout.guide": "Kılavuz",

    // Home page
    "home.title": "Hastalar",
    "home.newPatient": "Yeni Hasta",
    "home.empty.title": "Henüz hasta yok",
    "home.empty.description":
      "OCT taramalarını yüklemeye ve görüntülemeye başlamak için ilk hastanızı oluşturun.",
    "home.loading": "Yükleniyor...",
    "home.actions": "İşlemler",
    "home.rename": "Yeniden Adlandır",
    "home.delete": "Sil",
    "home.images": "görüntü",
    "home.created": "Oluşturulma",
    "home.eye": "Göz",

    // New patient dialog
    "home.dialog.new.title": "Yeni Hasta",
    "home.dialog.new.description":
      "Bu hasta için bir isim girin ve göz tarafını seçin.",
    "home.dialog.new.nameLabel": "İsim",
    "home.dialog.new.namePlaceholder": "ör. Ahmet Yılmaz",
    "home.dialog.new.eyeLabel": "Göz",
    "home.dialog.new.cancel": "İptal",
    "home.dialog.new.create": "Oluştur",
    "home.dialog.new.creating": "Oluşturuluyor...",

    // Rename dialog
    "home.dialog.rename.title": "Hastayı Yeniden Adlandır",
    "home.dialog.rename.description": "Bu hasta için yeni bir isim girin.",
    "home.dialog.rename.placeholder": "Hasta adı",
    "home.dialog.rename.cancel": "İptal",
    "home.dialog.rename.save": "Kaydet",
    "home.dialog.rename.saving": "Kaydediliyor...",

    // Delete dialog
    "home.dialog.delete.title": "Hastayı Sil",
    "home.dialog.delete.description":
      "Şunu silmek istediğinizden emin misiniz:",
    "home.dialog.delete.warning":
      "? Bu işlem hastayı ve ilişkili tüm görüntüleri kalıcı olarak kaldıracaktır. Bu işlem geri alınamaz.",
    "home.dialog.delete.cancel": "İptal",
    "home.dialog.delete.confirm": "Sil",
    "home.dialog.delete.deleting": "Siliniyor...",

    // Toast messages
    "toast.patientCreated": "Hasta oluşturuldu",
    "toast.patientCreateFailed": "Hasta oluşturulamadı",
    "toast.patientRenamed": "Hasta yeniden adlandırıldı",
    "toast.patientRenameFailed": "Hasta yeniden adlandırılamadı",
    "toast.patientDeleted": "Hasta silindi",
    "toast.patientDeleteFailed": "Hasta silinemedi",
    "toast.uploadedImages": "{count} görüntü yüklendi",
    "toast.uploadImagesFailed": "Görüntüler yüklenemedi",
    "toast.uploadedMasks": "{count} maske yüklendi",
    "toast.uploadMasksFailed": "Maskeler yüklenemedi",
    "toast.detectedLabels": "{count} yeni etiket tespit edildi",
    "toast.removed": "{filename} kaldırıldı",
    "toast.removeFailed": "Görüntü kaldırılamadı",
    "toast.removeMaskFailed": "Maske kaldırılamadı",

    // Patient detail page
    "patient.backToPatients": "Hastalara dön",
    "patient.toggleEye": "Göz değiştirmek için tıklayın",
    "patient.viewIn3D": "3D Görüntüle",
    "patient.uploadMasksFirst":
      "3D görünümü etkinleştirmek için maske yükleyin",
    "patient.octImages": "OCT Görüntüleri",
    "patient.masks": "Maskeler",
    "patient.loading": "Yükleniyor...",
    "patient.notFound": "Hasta bulunamadı.",

    // Upload zones
    "upload.uploading": "Yükleniyor...",
    "upload.uploadingMasks": "Maskeler yükleniyor ve analiz ediliyor...",
    "upload.dropFiles": "Dosyaları buraya bırakın...",
    "upload.dropMasks": "Maske dosyalarını buraya bırakın...",
    "upload.addMoreOct": "Daha fazla OCT görüntüsü ekle",
    "upload.addMoreMasks": "Daha fazla maske görüntüsü ekle",
    "upload.dragDropOct":
      "OCT görüntülerini sürükleyip bırakın veya tıklayarak seçin",
    "upload.dragDropMasks":
      "Maske görüntülerini sürükleyip bırakın veya tıklayarak seçin",
    "upload.fileTypes": "PNG, JPG dosyaları kabul edilir",

    // Mask grid
    "maskGrid.empty": "Henüz maske yüklenmedi",

    // Label config
    "labelConfig.title": "Etiket Yapılandırması",
    "labelConfig.cycleColor": "Renk değiştirmek için tıklayın",

    // Image viewer
    "viewer.loading": "Yükleniyor...",
    "viewer.hideEdges": "Kenarları gizle",
    "viewer.showEdges": "Kenarları göster",
    "viewer.edgeWidth": "Kenar kalınlığı",

    // 3D viewer
    "viewer3d.loading": "Yükleniyor...",
    "viewer3d.loadingMasks": "Maskeler yükleniyor...",
    "viewer3d.buildingVolume": "3D hacim oluşturuluyor...",
    "viewer3d.calculatingETDRS": "ETDRS hacimleri hesaplanıyor...",
    "viewer3d.generatingMeshes": "3D modeller oluşturuluyor...",
    "viewer3d.generatingMesh": "{name} modeli oluşturuluyor...",
    "viewer3d.noLabels": "Maskelerde etiket bulunamadı",
    "viewer3d.noMasks": "Maske bulunamadı",
    "viewer3d.noMeshes": "Model oluşturulamadı",
    "viewer3d.dimensions": "Boyutlar",
    "viewer3d.eye": "Göz",
    "viewer3d.meshCount": "Modeller",
    "viewer3d.controlsRotate": "Döndür",
    "viewer3d.controlsPan": "Kaydır",
    "viewer3d.controlsZoom": "Yakınlaştır",
    "viewer3d.leftClick": "Sol Tık:",
    "viewer3d.rightClick": "Sağ Tık:",
    "viewer3d.scroll": "Kaydırma:",
    "viewer3d.close": "Kapat",
    "viewer3d.layers": "Katmanlar",
    "viewer3d.back": "Geri",

    // Sidebar 3D
    "sidebar.title": "3D Görselleştirme",
    "sidebar.subtitle": "OCT Segmentasyon Katmanları",
    "sidebar.export": "Ölçümleri Dışa Aktar (CSV)",
    "sidebar.avgThickness": "Ortalama Kalınlık",
    "sidebar.volumeMeasurements": "Hacim Ölçümleri",
    "sidebar.layersCount": "Katmanlar ({count})",
    "sidebar.opacity": "Opaklık",
    "sidebar.vertices": "{count} köşe noktası",
    "sidebar.slicesCount": "Kesitler ({valid}/{total})",
    "sidebar.show": "Göster",
    "sidebar.hide": "Gizle",
    "sidebar.showAll": "Tümünü Göster",
    "sidebar.hideAll": "Tümünü Gizle",
    "sidebar.validOnly": "Yalnızca Geçerli",
    "sidebar.crossSection": "Kesit Görünümü",

    // ETDRS Grid
    "etdrs.title": "ETDRS Hacimleri (nL)",
    "etdrs.titleVolume": "Hacim",
    "etdrs.titleThickness": "Ortalama Kalınlık",
    "etdrs.nasal": "N",
    "etdrs.temporal": "T",
    "etdrs.superior": "S",
    "etdrs.inferior": "I",

    // Guide page
    "guide.title": "Kullanım Kılavuzu",
    "guide.description":
      "Segmentasyon görselleştirme ve nicel analiz için 3D OCT Görüntüleyici'yi nasıl kullanacağınızı öğrenin.",
    "guide.s1.title": "1. Genel Bakış",
    "guide.s1.content":
      "3D OCT Görüntüleyici, OCT (Optik Koherens Tomografi) segmentasyon maskelerini interaktif 3D ortamda görselleştirmek ve ölçümlemek için web tabanlı bir analiz aracıdır. ETDRS tabanlı hacim ölçümlerini ve ortalama tabaka kalınlıklarını gerçek fiziksel ölçekte hesaplar, retina tabakalarının ve sıvı birikimlerinin 3D modellerini oluşturur. Tüm işlemler tamamen tarayıcınızda çalışır, sunucu veya veri yüklemesi gerekmez.",
    "guide.s2.title": "2. Başlarken",
    "guide.s2.step1.label": "Hasta Oluşturma",
    "guide.s2.step1.text":
      'Ana sayfada "Yeni Hasta" butonuna tıklayın. Bir isim girin ve göz tarafını (OD veya OS) seçin.',
    "guide.s2.step2.label": "OCT Görüntüleri Yükleme",
    "guide.s2.step2.text":
      "Hasta sayfasını açın, \"OCT Görüntüleri\" sekmesine geçin ve OCT görüntülerinizi (PNG veya JPG) sürükleyip bırakın. Dosya adları doğal bir sıra izlemelidir (ör. p1.png'den p25.png'ye).",
    "guide.s2.step3.label": "Segmentasyon Maskeleri Yükleme",
    "guide.s2.step3.text":
      '"Maskeler" sekmesine geçin ve ilgili segmentasyon maskesi PNG\'lerini yükleyin. Her pikselin R kanalı değeri bir etiket kimliğini temsil eder (0 = arka plan, 1–N = doku sınıfları). Doğru eşleştirme için dosya adları OCT görüntüleriyle eşleşmelidir.',
    "guide.s2.step4.label": "Etiketleri Yapılandırma",
    "guide.s2.step4.text":
      "Maskeleri yükledikten sonra, tespit edilen etiketler kenar çubuğunda görünür. Bunları yeniden adlandırın (ör. Katman 1 → NSR, Katman 3 → SRF) ve renk örneğine tıklayarak renk atayın.",
    "guide.s3.title": "3. Görüntü İzleyici",
    "guide.s3.content":
      "Tam ekran görüntüleyiciyi açmak için herhangi bir OCT görüntü küçük resmine tıklayın. Aynı göz için hem görüntüler hem de maskeler yüklendiğinde, her segmentasyon etiketinin renkli kenarları otomatik olarak OCT görüntülerinin üzerine bindirilir.",
    "guide.s3.f1":
      "Kaydırma tekerleği veya ekran kontrolleriyle yakınlaştırma/uzaklaştırma, tıklayıp sürükleyerek kaydırma",
    "guide.s3.f2":
      "Ok tuşları veya alt kontrollerle görüntüler arasında gezinme",
    "guide.s3.f3":
      "Katmanlar butonu (sol alt) ile kenar bindirmesini açma/kapama",
    "guide.s3.f4":
      "Gösterge panelindeki (sağ alt) kaydırıcı ile kenar kalınlığını ayarlama",
    "guide.s4.title": "4. 3D Görselleştirme",
    "guide.s4.content":
      'Segmentasyon maskelerinden etkileşimli 3D modeller oluşturmak için hasta sayfasında "3D Görüntüle" butonuna tıklayın. İşlem hattı, pürüzsüz ve hacim koruyan yüzeyler üretmek için Z ekseni interpolasyonu, anizotropik Gauss bulanıklaştırma ve Taubin düzleştirmesi ile yürüyen küpler (marching cubes) algoritmasını kullanır.',
    "guide.s4.f1": "Döndürme: sol tıklayıp sürükleme",
    "guide.s4.f2": "Kaydırma: sağ tıklayıp sürükleme",
    "guide.s4.f3": "Yakınlaştırma: kaydırma tekerleği",
    "guide.s4.f4":
      "Katman bazında görünürlük açma/kapama ve opaklık kaydırıcıları",
    "guide.s4.f5":
      "Hacmi derinlik ekseni boyunca kesmek için kesit kaydırıcısı",
    "guide.s4.f6":
      "Kesitler paneli: her yüklenen görüntünün 3D render'da nereye karşılık geldiğini görmek için kesit ızgarasını açıp kapatma, hacim içindeki belirli kesitleri incelemek için bireysel kesitleri gösterme veya gizleme",
    "guide.s5.title": "5. Ölçümler",
    "guide.s5.content":
      "Tüm ölçümler varsayılan OCT aralıkları (X: 11,54 µm, Y: 3,87 µm, Z: 246,0 µm) kullanılarak gerçek fiziksel ölçekte hesaplanır.",
    "guide.s5.f1":
      "Ortalama kalınlık (µm): tüm D×W sütunlarındaki ortalama tabaka kalınlığı",
    "guide.s5.f2": "Toplam hacim (nL): etiket başına toplam hacim",
    "guide.s5.f3":
      "ETDRS hacimleri (nL): 9 sektörlü dairesel ızgarada bölge başına hacimler",
    "guide.s5.f4":
      "ETDRS bölgeleri: merkez (1 mm), iç halka (3 mm), dış halka (6 mm)",
    "guide.s5.f5":
      "Nazal/Temporal yönlendirme seçilen göze göre uyarlanır (OD ve OS)",
    "guide.s5.f6":
      "Kenar çubuğundaki dışa aktarma butonu ile tüm ölçümleri CSV'ye aktarma",
    "guide.s6.title": "6. Girdi Formatı",
    "guide.s6.content":
      "Maskeler, her piksel değerinin bir sınıf etiketini kodladığı (R kanalı) gri tonlamalı PNG'ler olmalıdır. Tipik bir yapılandırma:",
    "guide.s6.th1": "Piksel değeri",
    "guide.s6.th2": "Anlam",
    "guide.s6.r1": "Arka Plan",
    "guide.s6.r2": "NSR (Nörosensoriyel Retina)",
    "guide.s6.r3": "RPE (Retina Pigment Epiteli)",
    "guide.s6.r4": "SRF (Subretinal Sıvı)",
    "guide.s6.r5": "PED (Pigment Epitel Dekolmanı)",
    "guide.s6.r6": "Ek özel etiketler",
    "guide.s7.title": "7. Veri Gizliliği",
    "guide.s7.content":
      "Tüm veriler (görüntüler, maskeler, ölçümler) tarayıcınızın IndexedDB'sinde yerel olarak depolanır. Hiçbir şey herhangi bir sunucuya yüklenmez. Tarayıcı verilerinizi temizlemek, tüm kayıtlı hastaları ve görüntüleri kaldıracaktır.",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];
export default translations;

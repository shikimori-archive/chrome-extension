package one.shikimori;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class Main {
    private static Comparator<Item> episodeComparator = Comparator.comparing(i -> i.episode);
    private static Comparator<Item> kindComparator = Comparator.comparing(i -> i.kind);
    private static Comparator<Item> authorComparator = Comparator.comparing(i -> i.author);
    private static Comparator<Item> itemComparator = episodeComparator.thenComparing(kindComparator).thenComparing(authorComparator);

    public static String encode(String value) {
        byte[] bytes = Base64.getEncoder().encode(value.getBytes(StandardCharsets.UTF_8));
        return new String(bytes, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) throws IOException {
        final File input = new File(args[0]);
        final File output = new File(args[1]);
        final Map<Integer, List<Item>> items = new HashMap<>();
        CSVFormat format = CSVFormat.DEFAULT.withDelimiter(';').withFirstRecordAsHeader();
        try (final CSVParser parser = new CSVParser(new BufferedReader(new InputStreamReader(new FileInputStream(input), StandardCharsets.UTF_8)), format)) {
            Iterator<CSVRecord> iterator = parser.iterator();
            int lineNumber = 0;
            while (iterator.hasNext()) {
                System.out.println("Processing line: " + (lineNumber + 1));
                final CSVRecord record = iterator.next();
                final int animeId = Integer.parseInt(record.get("anime_id"));
                final Item item = new Item(
                        Integer.parseInt(record.get("id")),
                        encode(record.get("url")),
                        Integer.parseInt(record.get("episode")),
                        record.get("kind"),
                        record.get("language"),
                        encode(record.get("author"))
                );
                items.computeIfAbsent(animeId, k -> new ArrayList<>()).add(item);
                lineNumber++;
            }
        }
        final ObjectWriter objectMapper = new ObjectMapper().writerWithDefaultPrettyPrinter();
        int itemNumber = 0;
        for (Map.Entry<Integer, List<Item>> entry : items.entrySet()) {
            final int animeId = entry.getKey();
            final List<Item> list = entry.getValue();
            list.sort(itemComparator);
            final File directory = new File(output, animeId + "");
            if (directory.mkdirs()) {
                System.out.println("Directory is created: " + directory);
            }
            final File file = new File(directory, "data.json");
            try (final Writer writer = new BufferedWriter(new FileWriter(file))) {
                objectMapper.writeValue(writer, new Data(list));
            }
            ++itemNumber;
            System.out.println("Data is written: " + itemNumber + "/" + items.size());
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        final List<Item> items;

        @JsonCreator
        public Data(final @JsonProperty("items") List<Item> items) {
            this.items = items;
        }

        public List<Item> getItems() {
            return items;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        final int id;
        final String url;
        final int episode;
        final String kind;
        final String language;
        final String author;

        @JsonCreator
        public Item(final @JsonProperty("id") int id,
                    final @JsonProperty("url") String url,
                    final @JsonProperty("episode") int episode,
                    final @JsonProperty("kind") String kind,
                    final @JsonProperty("language") String language,
                    final @JsonProperty("author") String author) {
            this.id = id;
            this.url = url;
            this.episode = episode;
            this.kind = kind;
            this.language = language;
            this.author = author;
        }

        public int getId() {
            return id;
        }

        public String getUrl() {
            return url;
        }

        public int getEpisode() {
            return episode;
        }

        public String getKind() {
            return kind;
        }

        public String getLanguage() {
            return language;
        }

        public String getAuthor() {
            return author;
        }
    }
}